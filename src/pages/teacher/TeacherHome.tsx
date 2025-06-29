import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/analytics/StatCard';
import LineChart from '../../components/analytics/LineChart';
import BarChart from '../../components/analytics/BarChart';
import TeacherOnboarding from '../../components/onboarding/TeacherOnboarding';

interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

interface CourseWithStats {
  id: number;
  title: string;
  price: number;
  student_count: number;
  revenue: number;
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  icon: string;
  color: string;
}

const TeacherHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 4.8
  });
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<{month: string, revenue: number}[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{month: string, count: number}[]>([]);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
    
    // Check if welcome guide has been dismissed before
    const welcomeGuideDismissed = localStorage.getItem('teacherWelcomeGuideDismissed');
    if (welcomeGuideDismissed === 'true') {
      setShowWelcomeGuide(false);
    }

    // Check if onboarding has been shown before
    const onboardingShown = localStorage.getItem('teacherOnboardingShown');
    if (onboardingShown !== 'true') {
      setShowOnboarding(true);
      localStorage.setItem('teacherOnboardingShown', 'true');
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Fetch courses created by the teacher with enrollment stats
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments(student_id, enrolled_at)
        `)
        .eq('instructor_id', user.id);

      if (coursesError) throw coursesError;

      // Process courses data and calculate stats
      const processedCourses: CourseWithStats[] = (coursesData || []).map(course => {
        const studentCount = course.enrollments?.length || 0;
        const revenue = studentCount * course.price;
        
        return {
          id: course.id,
          title: course.title,
          price: course.price,
          student_count: studentCount,
          revenue: revenue,
          created_at: course.created_at
        };
      });

      setCourses(processedCourses.slice(0, 3)); // Show top 3 courses

      // Calculate overall stats
      const totalCourses = processedCourses.length;
      const totalStudents = new Set(
        processedCourses.flatMap(course => 
          course.enrollments?.map(e => e.student_id) || []
        )
      ).size;
      const totalRevenue = processedCourses.reduce((sum, course) => sum + course.revenue, 0);

      setStats({
        totalCourses,
        totalStudents,
        totalRevenue,
        averageRating: 4.8 // This would be calculated from actual reviews in a real system
      });

      // Generate revenue and enrollment data for charts
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
      }).reverse();

      // Initialize data structures
      const revenueByMonth: {[key: string]: number} = {};
      const enrollmentsByMonth: {[key: string]: number} = {};
      
      last6Months.forEach(month => {
        revenueByMonth[month] = 0;
        enrollmentsByMonth[month] = 0;
      });

      // Process course enrollments
      processedCourses.forEach(course => {
        const price = course.price;
        
        (course.enrollments || []).forEach((enrollment: any) => {
          const enrollmentMonth = new Date(enrollment.enrolled_at).toISOString().split('T')[0].substring(0, 7);
          
          // Only count enrollments in the last 6 months
          if (last6Months.includes(enrollmentMonth)) {
            revenueByMonth[enrollmentMonth] += price;
            enrollmentsByMonth[enrollmentMonth] += 1;
          }
        });
      });

      // Format data for charts
      setRevenueData(last6Months.map(month => ({
        month,
        revenue: revenueByMonth[month]
      })));

      setEnrollmentData(last6Months.map(month => ({
        month,
        count: enrollmentsByMonth[month]
      })));

      // Generate recent activity based on real data
      const activities: RecentActivity[] = [];

      // Add recent enrollments
      if (totalStudents > 0) {
        activities.push({
          id: 'enrollment-1',
          type: 'enrollment',
          title: `${totalStudents} students enrolled in your courses`,
          date: new Date().toISOString(),
          icon: 'users-group-rounded-bold-duotone',
          color: 'text-green-600'
        });
      }

      // Add course creation activities
      processedCourses.slice(0, 2).forEach((course, index) => {
        activities.push({
          id: `course-${course.id}`,
          type: 'course_created',
          title: `Course "${course.title}" published`,
          date: course.created_at,
          icon: 'book-bookmark-bold-duotone',
          color: 'text-blue-600'
        });
      });

      // Add revenue activity
      if (totalRevenue > 0) {
        activities.push({
          id: 'revenue-1',
          type: 'revenue',
          title: `Generated $${totalRevenue.toFixed(2)} in course sales`,
          date: new Date().toISOString(),
          icon: 'dollar-bold-duotone',
          color: 'text-purple-600'
        });
      }

      // Sort activities by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 3));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = (courseId: number) => {
    navigate(`/teacher/dashboard/view-course/${courseId}`);
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/teacher/dashboard/edit-course/${courseId}`);
  };

  const dismissWelcomeGuide = () => {
    setShowWelcomeGuide(false);
    localStorage.setItem('teacherWelcomeGuideDismissed', 'true');
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

  // Prepare chart data
  const revenueLabels = revenueData.map(item => {
    const [year, month] = item.month.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
  });
  const revenueValues = revenueData.map(item => item.revenue);

  const enrollmentLabels = enrollmentData.map(item => {
    const [year, month] = item.month.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
  });
  const enrollmentValues = enrollmentData.map(item => item.count);

  // Prepare course performance data
  const courseLabels = courses.map(course => course.title);
  const courseStudents = courses.map(course => course.student_count);
  const courseRevenue = courses.map(course => course.revenue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || 'Partner'}!</h1>
        <p className="text-gray-600">Here's how your courses are performing</p>
      </div>

      {/* Welcome Guide for Teachers */}
      {showWelcomeGuide && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="info-circle-bold-duotone" size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Your Instructor Dashboard</h3>
                <p className="text-gray-700 mb-4">
                  This is your instructor dashboard where you can manage your courses, track performance, and create new content.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Key Features:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Track course performance and revenue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Manage your existing courses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Create new courses with AI assistance</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Getting Started:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Create your first course in the "Create" section</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Monitor student progress and engagement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Use analytics to improve your courses</span>
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
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Courses Created"
          value={stats.totalCourses}
          icon="book-bookmark-bold-duotone"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        
        <StatCard
          title="Total Learners"
          value={stats.totalStudents}
          icon="users-group-rounded-bold-duotone"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          change={{ value: 12, isPositive: true }}
          footer="vs. previous month"
        />
        
        <StatCard
          title="Revenue Generated"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon="dollar-bold-duotone"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          change={{ value: 8, isPositive: true }}
          footer="vs. previous month"
        />
        
        <StatCard
          title="Average Rating"
          value={stats.averageRating}
          icon="star-bold-duotone"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Revenue Trend</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'month' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setTimeRange('quarter')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'quarter' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quarterly
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'year' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <LineChart
            title=""
            labels={revenueLabels}
            datasets={[
              {
                label: 'Revenue ($)',
                data: revenueValues,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
              }
            ]}
            height={250}
          />
        </div>

        <div className="card p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Learner Enrollments</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'month' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setTimeRange('quarter')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'quarter' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quarterly
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'year' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <LineChart
            title=""
            labels={enrollmentLabels}
            datasets={[
              {
                label: 'New Enrollments',
                data: enrollmentValues,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
              }
            ]}
            height={250}
          />
        </div>
      </div>

      {/* Course Performance */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Performance</h2>
        <BarChart 
          title=""
          labels={courseLabels}
          datasets={[
            {
              label: 'Learners',
              data: courseStudents,
              backgroundColor: '#3B82F6',
            },
            {
              label: 'Revenue ($)',
              data: courseRevenue,
              backgroundColor: '#10B981',
            }
          ]}
          height={300}
        />
      </div>

      {/* My Courses Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/teacher/dashboard/my-courses')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Courses
            </button>
            <button 
              onClick={() => navigate('/teacher/dashboard/create')}
              className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Icon name="add-square-bold-duotone" size={16} />
              Create New Course
            </button>
          </div>
        </div>
        
        {courses.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="book-bookmark-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-4">Create your first course to start teaching</p>
            <button 
              onClick={() => navigate('/teacher/dashboard/create')}
              className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="card p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{course.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Learners</p>
                      <p className="font-semibold text-gray-900">{course.student_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold text-gray-900">${course.revenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-semibold text-gray-900">${course.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900">Published</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewCourse(course.id)}
                      className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Icon name="eye-bold-duotone" size={14} />
                      View
                    </button>
                    <button 
                      onClick={() => handleEditCourse(course.id)}
                      className="flex-1 gradient-button text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1"
                    >
                      <Icon name="pen-bold-duotone" size={14} />
                      Edit
                    </button>
                    <button 
                      onClick={() => navigate(`/teacher/dashboard/courses/${course.id}/analytics`)}
                      className="flex-1 border border-blue-600 text-blue-600 px-3 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Icon name="chart-bar-bold-duotone" size={14} />
                      Stats
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/teacher/dashboard/create')}
            className="card p-6 text-center hover:bg-blue-50 transition-colors"
          >
            <Icon name="add-square-bold-duotone" size={32} className="text-blue-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Create Course</p>
          </button>
          
          <button 
            onClick={() => navigate('/teacher/dashboard/my-courses')}
            className="card p-6 text-center hover:bg-green-50 transition-colors"
          >
            <Icon name="book-bookmark-bold-duotone" size={32} className="text-green-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Manage Courses</p>
          </button>
          
          <button className="card p-6 text-center hover:bg-purple-50 transition-colors">
            <Icon name="users-group-rounded-bold-duotone" size={32} className="text-purple-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Learner Messages</p>
          </button>
          
          <button className="card p-6 text-center hover:bg-orange-50 transition-colors">
            <Icon name="dollar-bold-duotone" size={32} className="text-orange-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Earnings Report</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="card p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="trending-up-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600">Start creating courses to see your activity here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center ${activity.color}`}>
                    <Icon name={activity.icon} size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && <TeacherOnboarding onClose={handleCloseOnboarding} />}
    </div>
  );
};

export default TeacherHome;