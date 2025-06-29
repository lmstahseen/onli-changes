import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface EnrolledCourse {
  id: number;
  title: string;
  instructor_name: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
  price: number;
  enrolled_at: string;
  category: string;
  difficulty: string;
  image_url: string;
}

const StudentMyCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseToUnenroll, setCourseToUnenroll] = useState<EnrolledCourse | null>(null);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [menuOpenCourseId, setMenuOpenCourseId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    }
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Optimized query to fetch enrolled courses with progress
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          progress,
          enrolled_at,
          courses!inner (
            id,
            title,
            instructor_name,
            price,
            category,
            difficulty,
            image_url
          )
        `)
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentError) throw enrollmentError;

      // Get lesson counts for each course in parallel
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
            progress: enrollment.progress,
            total_lessons: totalLessonsResult.count || 0,
            completed_lessons: completedCount.count || 0,
            price: course.price,
            enrolled_at: enrollment.enrolled_at,
            category: course.category,
            difficulty: course.difficulty,
            image_url: course.image_url || 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg'
          };
        })
      );

      setCourses(coursesWithProgress);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!courseToUnenroll || !user) return;
    
    try {
      setIsUnenrolling(true);
      
      // Delete enrollment record
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseToUnenroll.id);
        
      if (enrollmentError) throw enrollmentError;
      
      // Delete lesson progress records
      // First get module IDs for this course
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseToUnenroll.id);
        
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        
        // Get lesson IDs for these modules
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .in('module_id', moduleIds);
          
        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(l => l.id);
          
          // Delete progress records for these lessons
          const { error: progressError } = await supabase
            .from('lesson_progress')
            .delete()
            .eq('student_id', user.id)
            .in('lesson_id', lessonIds);
            
          if (progressError) throw progressError;
        }
      }
      
      // Update local state to remove the course
      setCourses(courses.filter(course => course.id !== courseToUnenroll.id));
      setShowUnenrollModal(false);
      setCourseToUnenroll(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unenroll from course');
    } finally {
      setIsUnenrolling(false);
    }
  };

  const toggleCourseMenu = (courseId: number) => {
    if (menuOpenCourseId === courseId) {
      setMenuOpenCourseId(null);
    } else {
      setMenuOpenCourseId(courseId);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your courses...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Courses</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadEnrolledCourses}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalStudyHours = courses.reduce((sum, course) => sum + (course.completed_lessons * 0.75), 0);
  const totalLessons = courses.reduce((sum, course) => sum + course.total_lessons, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completed_lessons, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">Track your progress and continue learning</p>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <Icon name="book-bookmark-bold-duotone" size={32} className="text-blue-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
          <p className="text-gray-600">Enrolled Courses</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="clock-circle-bold-duotone" size={32} className="text-green-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{Math.round(totalStudyHours)}</p>
          <p className="text-gray-600">Total Hours</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="users-group-rounded-bold-duotone" size={32} className="text-purple-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
          <p className="text-gray-600">Total Lessons</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="play-circle-bold-duotone" size={32} className="text-orange-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{completedLessons}</p>
          <p className="text-gray-600">Lessons Completed</p>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="card p-8">
            <Icon name="book-bookmark-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses enrolled</h3>
            <p className="text-gray-600 mb-4">
              Start your learning journey by exploring available courses
            </p>
            <button 
              onClick={() => navigate('/student/dashboard/explore')}
              className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
            >
              Explore Courses
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                {/* Course Image */}
                <div className="md:w-1/3 h-40 md:h-auto overflow-hidden">
                  <img 
                    src={course.image_url} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                
                {/* Course Content */}
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          course.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">{course.instructor_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="capitalize">{course.category.replace('-', ' ')}</span>
                        <span>•</span>
                        <span>Enrolled on {new Date(course.enrolled_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => toggleCourseMenu(course.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      >
                        <Icon name="menu-dots-vertical-bold-duotone" size={20} />
                      </button>
                      
                      {menuOpenCourseId === course.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                          <button
                            onClick={() => {
                              setCourseToUnenroll(course);
                              setShowUnenrollModal(true);
                              setMenuOpenCourseId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Icon name="trash-bin-trash-bold-duotone" size={16} />
                            <span>Unenroll from course</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        {course.completed_lessons} of {course.total_lessons} lessons
                      </span>
                      <span className="text-sm font-medium text-gray-900">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#2727E6] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/student/dashboard/courses/${course.id}`)}
                    className="gradient-button text-white px-6 py-2 rounded-lg font-medium w-full flex items-center justify-center gap-2"
                  >
                    <Icon name="play-circle-bold-duotone" size={16} />
                    {course.progress === 0 ? 'Start Course' : 'Continue Learning'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explore More */}
      {courses.length > 0 && (
        <div className="mt-12 text-center">
          <div className="card p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready for More?</h3>
            <p className="text-gray-600 mb-6">Explore thousands of courses and expand your knowledge</p>
            <button 
              onClick={() => navigate('/student/dashboard/explore')}
              className="gradient-button text-white px-8 py-3 rounded-xl font-semibold"
            >
              Explore More Courses
            </button>
          </div>
        </div>
      )}

      {/* Unenroll Confirmation Modal */}
      {showUnenrollModal && courseToUnenroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Unenroll from Course</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unenroll from <span className="font-semibold">{courseToUnenroll.title}</span>? 
              This will remove the course from your dashboard and you'll lose your progress.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnenrollModal(false);
                  setCourseToUnenroll(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isUnenrolling}
              >
                Cancel
              </button>
              <button
                onClick={handleUnenroll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                disabled={isUnenrolling}
              >
                {isUnenrolling ? (
                  <>
                    <Icon name="spinner-bold-duotone" size={16} className="animate-spin" />
                    Unenrolling...
                  </>
                ) : (
                  <>
                    <Icon name="trash-bin-trash-bold-duotone" size={16} />
                    Unenroll
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMyCourses;