import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/analytics/StatCard';
import ProgressBar from '../../components/analytics/ProgressBar';
import LineChart from '../../components/analytics/LineChart';
import StudentOnboarding from '../../components/onboarding/StudentOnboarding';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { format, parseISO } from 'date-fns';

interface EnrolledCourse {
  id: number;
  title: string;
  instructor_name: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
  enrolled_at: string;
}

interface StudentStats {
  coursesEnrolled: number;
  hoursStudied: number;
  lessonsCompleted: number;
  streakDays: number;
  averageQuizScore: number;
}

interface ActivityData {
  date: string;
  count: number;
}

interface UpcomingLesson {
  id: number;
  title: string;
  scheduled_date: string;
  path_title: string;
  module_title: string;
}

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    coursesEnrolled: 0,
    hoursStudied: 0,
    lessonsCompleted: 0,
    streakDays: 0,
    averageQuizScore: 0
  });
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadUpcomingLessons();
    }
    
    // Check if welcome guide has been dismissed before
    const welcomeGuideDismissed = localStorage.getItem('welcomeGuideDismissed');
    if (welcomeGuideDismissed === 'true') {
      setShowWelcomeGuide(false);
    }

    // Check if onboarding has been shown before
    const onboardingShown = localStorage.getItem('studentOnboardingShown');
    if (onboardingShown !== 'true') {
      setShowOnboarding(true);
      localStorage.setItem('studentOnboardingShown', 'true');
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Fetch enrolled courses with progress in a single optimized query
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          progress,
          enrolled_at,
          courses!inner (
            id,
            title,
            instructor_name,
            category,
            difficulty,
            image_url
          )
        `)
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentError) throw enrollmentError;

      // Get lesson counts and progress for each course in parallel
      const coursesWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          const course = enrollment.courses;
          
          // Get module IDs for this course first
          const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', course.id);

          if (modulesError) throw modulesError;

          const moduleIds = modules?.map(m => m.id) || [];

          // Get lesson counts in parallel using module IDs
          const [totalLessonsResult, completedLessonsResult] = await Promise.all([
            supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .in('module_id', moduleIds),
            moduleIds.length > 0 ? supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds)
              .then(async ({ data: lessonData, error: lessonError }) => {
                if (lessonError) throw lessonError;
                const lessonIds = lessonData?.map(l => l.id) || [];
                
                if (lessonIds.length === 0) {
                  return { count: 0 };
                }

                return supabase
                  .from('lesson_progress')
                  .select('*', { count: 'exact', head: true })
                  .eq('student_id', user.id)
                  .eq('completed', true)
                  .in('lesson_id', lessonIds);
              }) : Promise.resolve({ count: 0 })
          ]);

          const completedCount = await completedLessonsResult;

          return {
            id: course.id,
            title: course.title,
            instructor_name: course.instructor_name,
            category: course.category,
            difficulty: course.difficulty,
            image_url: course.image_url || 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
            progress: enrollment.progress,
            total_lessons: totalLessonsResult.count || 0,
            completed_lessons: completedCount.count || 0,
            enrolled_at: enrollment.enrolled_at
          };
        })
      );

      setCourses(coursesWithProgress);

      // Get all completed lessons to calculate activity data
      const { data: rawLessonProgressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('completed_at')
        .eq('student_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (progressError) throw progressError;

      // Get quiz attempts
      const { data: quizAttempts, error: quizError } = await supabase
        .from('student_quiz_attempts')
        .select('score')
        .eq('student_id', user.id);

      if (quizError) throw quizError;

      // Calculate average quiz score
      const averageQuizScore = quizAttempts && quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
        : 0;

      // Calculate stats
      const totalCourses = coursesWithProgress.length;
      const totalLessons = coursesWithProgress.reduce((sum, course) => sum + course.total_lessons, 0);
      const completedLessons = coursesWithProgress.reduce((sum, course) => sum + course.completed_lessons, 0);
      const hoursStudied = Math.round(completedLessons * 0.75); // Estimate 45 minutes per lesson
      const streakDays = calculateStreakDays(rawLessonProgressData || []);

      setStats({
        coursesEnrolled: totalCourses,
        hoursStudied: hoursStudied,
        lessonsCompleted: completedLessons,
        streakDays: streakDays,
        averageQuizScore: averageQuizScore
      });

      // Generate activity data for the last 7 days
      setActivityData(generateActivityData(rawLessonProgressData || []));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingLessons = async () => {
    try {
      setLoadingUpcoming(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Call the function to get upcoming lessons
      const { data, error } = await supabase
        .rpc('get_upcoming_lessons', { 
          p_user_id: user?.id,
          p_date: today,
          p_limit: 5
        });
      
      if (error) throw error;
      
      setUpcomingLessons(data || []);
    } catch (err) {
      console.error('Failed to load upcoming lessons:', err);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  // Helper function to calculate streak days
  const calculateStreakDays = (progressData: any[]): number => {
    if (progressData.length === 0) return 0;
    
    // Get unique dates when lessons were completed
    const completionDates = progressData
      .filter(lesson => lesson.completed_at)
      .map(lesson => new Date(lesson.completed_at).toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (completionDates.length === 0) return 0;

    // Check if the most recent date is today or yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (completionDates[0] !== today && completionDates[0] !== yesterday) {
      return 0; // Streak broken
    }

    // Count consecutive days
    let streak = 1;
    for (let i = 1; i < completionDates.length; i++) {
      const currentDate = new Date(completionDates[i-1]);
      const prevDate = new Date(completionDates[i]);
      
      // Check if dates are consecutive
      currentDate.setDate(currentDate.getDate() - 1);
      if (currentDate.toISOString().split('T')[0] === completionDates[i]) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Helper function to generate activity data
  const generateActivityData = (completedLessons: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    // Count lessons completed per day
    const activityCounts: { [key: string]: number } = {};
    
    completedLessons.forEach(lesson => {
      if (!lesson.completed_at) return;
      
      const date = new Date(lesson.completed_at).toISOString().split('T')[0];
      activityCounts[date] = (activityCounts[date] || 0) + 1;
    });

    // Format data for the last 30 days
    return last30Days.map(date => ({
      date,
      count: activityCounts[date] || 0
    }));
  };

  const dismissWelcomeGuide = () => {
    setShowWelcomeGuide(false);
    localStorage.setItem('welcomeGuideDismissed', 'true');
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare activity chart data
  const activityLabels = activityData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });
  const activityCounts = activityData.map(item => item.count);

  // Prepare course progress chart data
  const courseLabels = courses.map(course => course.title);
  const courseProgress = courses.map(course => course.progress);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || 'Learner'}!</h1>
        <p className="text-gray-600">Ready to continue your learning journey?</p>
      </div>

      {/* Welcome Guide */}
      {showWelcomeGuide && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon name="info-circle-bold-duotone" size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Your Learning Dashboard</h3>
                  <p className="text-gray-700 mb-4">
                    This is your personalized dashboard where you can track your progress, view analytics, and continue your learning journey.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-800 mb-1">Key Features:</p>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex items-start gap-2">
                          <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                          <span>Track your learning progress and analytics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                          <span>Continue your enrolled courses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                          <span>Access AI-powered learning tools</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 mb-1">Getting Started:</p>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex items-start gap-2">
                          <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                          <span>Explore courses in the "Explore" section</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                          <span>Create personalized learning paths</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                          <span>Use the AI Tutor for personalized lessons</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={dismissWelcomeGuide}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon name="close-circle-bold-duotone" size={20} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Icon name="book-bookmark-bold-duotone" size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.coursesEnrolled}</p>
                <p className="text-gray-600">Courses Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Icon name="clock-circle-bold-duotone" size={24} className="text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.hoursStudied}</p>
                  <span className="text-sm font-medium text-green-600">+5%</span>
                </div>
                <p className="text-gray-600">Study Hours</p>
                <p className="text-xs text-gray-500">vs. previous week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Icon name="check-circle-bold-duotone" size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.lessonsCompleted}</p>
                  <span className="text-sm font-medium text-green-600">+3%</span>
                </div>
                <p className="text-gray-600">Lessons Completed</p>
                <p className="text-xs text-gray-500">vs. previous week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Icon name="fire-bold-duotone" size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.streakDays} days</p>
                <p className="text-gray-600">Current Streak</p>
                <p className="text-xs text-gray-500">Keep learning daily!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
          <Button 
            onClick={() => navigate('/student/dashboard/my-courses')}
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Courses
          </Button>
        </div>
        
        {courses.length === 0 ? (
          <Card className="p-8 text-center shadow-soft">
            <Icon name="book-bookmark-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses enrolled</h3>
            <p className="text-gray-600 mb-4">Start your learning journey by exploring available courses</p>
            <Button 
              onClick={() => navigate('/student/dashboard/explore')}
              variant="gradient"
              className="rounded-xl font-medium"
            >
              Explore Courses
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course) => (
              <Card key={course.id} className="overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
                {course.image_url && (
                  <div className="h-40 w-full overflow-hidden">
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        course.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{course.instructor_name}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          {course.completed_lessons} of {course.total_lessons} lessons
                        </span>
                        <span className="text-sm font-medium text-gray-900">{course.progress}%</span>
                      </div>
                      <ProgressBar
                        value={course.progress}
                        maxValue={100}
                        showPercentage={false}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Icon name="clock-circle-bold-duotone" size={14} />
                        <span>{course.total_lessons * 45} mins</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Icon name="category-bold-duotone" size={14} />
                        <span className="capitalize">{course.category.replace('-', ' ')}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => navigate(`/student/dashboard/courses/${course.id}`)}
                      variant="gradient"
                      className="w-full rounded-xl flex items-center justify-center gap-2"
                    >
                      <Icon name="play-circle-bold-duotone" size={16} />
                      Continue Learning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Analytics and Upcoming Lessons Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Learning Activity Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-900">Learning Activity</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setTimeRange('week')}
                  variant={timeRange === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                >
                  Week
                </Button>
                <Button 
                  onClick={() => setTimeRange('month')}
                  variant={timeRange === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                >
                  Month
                </Button>
                <Button 
                  onClick={() => setTimeRange('year')}
                  variant={timeRange === 'year' ? 'primary' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                >
                  Year
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart 
              title=""
              labels={activityLabels}
              datasets={[
                {
                  label: 'Lessons Completed',
                  data: activityCounts,
                  borderColor: '#2727E6',
                  backgroundColor: 'rgba(39, 39, 230, 0.1)',
                  fill: true,
                  tension: 0.4
                }
              ]}
              height={250}
            />
          </CardContent>
        </Card>

        {/* Upcoming Lessons */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Upcoming Lessons</CardTitle>
            <CardDescription>Your scheduled lessons from learning paths</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUpcoming ? (
              <div className="flex items-center justify-center h-48">
                <Icon name="spinner-bold-duotone" size={24} className="text-blue-600 animate-spin" />
              </div>
            ) : upcomingLessons.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="calendar-bold-duotone" size={48} className="text-gray-300 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">No upcoming lessons</h4>
                <p className="text-gray-500 mb-4">
                  Create a learning path to schedule your lessons
                </p>
                <Button 
                  onClick={() => navigate('/student/dashboard/learning-path')}
                  variant="gradient"
                  className="rounded-xl"
                >
                  Create Learning Path
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Icon name="book-bookmark-bold-duotone" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{lesson.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="truncate">{lesson.path_title}</span>
                        <span>•</span>
                        <span className="truncate">{lesson.module_title}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900">
                        {lesson.scheduled_date ? format(parseISO(lesson.scheduled_date), 'MMM d') : 'Unscheduled'}
                      </div>
                      <Button 
                        onClick={() => navigate(`/student/dashboard/personal-path-lessons/${lesson.id}`)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-none shadow-soft">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Learning Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Based on Your Progress</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Complete the remaining lessons in "{courses[0]?.title || 'your current course'}" to earn your certificate</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Review quiz questions you've missed to improve your understanding</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Maintain your {stats.streakDays}-day learning streak for consistent progress</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Suggested Next Steps</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Try the AI Tutor to reinforce concepts you're struggling with</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Explore related courses to build on your current knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Set a goal to study at least 30 minutes each day</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Modal */}
      {showOnboarding && <StudentOnboarding onClose={handleCloseOnboarding} />}
    </div>
  );
};

export default StudentHome;