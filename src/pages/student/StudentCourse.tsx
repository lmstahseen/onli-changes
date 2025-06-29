import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { supabase } from '../../lib/supabase';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  price: number;
  created_at: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  module_order: number;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface Lesson {
  id: number;
  title: string;
  lesson_order: number;
  duration: string;
  completed: boolean;
}

interface CourseData {
  course: Course;
  modules: Module[];
  enrollment: {
    progress: number;
    enrolled_at: string;
  };
}

const StudentCourse: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCourseData(id);
    }
  }, [id]);

  const loadCourseData = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        throw new Error('Course not found');
      }

      // Fetch enrollment details
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('progress, enrolled_at')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentError || !enrollment) {
        throw new Error('Not enrolled in this course');
      }

      // Fetch modules with lessons and progress
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          module_order
        `)
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError || !modules) {
        throw new Error('Failed to load modules');
      }

      // For each module, fetch its lessons with progress
      const modulesWithLessons = await Promise.all(modules.map(async (module) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select(`
            id,
            title,
            lesson_order,
            duration,
            lesson_progress!inner(completed)
          `)
          .eq('module_id', module.id)
          .eq('lesson_progress.student_id', user.id)
          .order('lesson_order');

        if (lessonsError) {
          throw new Error('Failed to load lessons');
        }

        // Transform lessons data
        const transformedLessons = lessons?.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          lesson_order: lesson.lesson_order,
          duration: lesson.duration,
          completed: lesson.lesson_progress?.[0]?.completed || false
        })) || [];

        return {
          ...module,
          lessons: transformedLessons,
          isExpanded: true // Default to expanded
        };
      }));

      setCourseData({
        course,
        modules: modulesWithLessons,
        enrollment
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonId: number) => {
    navigate(`/student/dashboard/lessons/${lessonId}`);
  };

  const toggleModuleExpanded = (moduleId: number) => {
    if (!courseData) return;
    
    setCourseData({
      ...courseData,
      modules: courseData.modules.map(module => 
        module.id === moduleId ? { ...module, isExpanded: !module.isExpanded } : module
      )
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/student/dashboard/my-courses')}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The requested course could not be found.</p>
          <button 
            onClick={() => navigate('/student/dashboard/my-courses')}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  const { course, modules, enrollment } = courseData;
  
  // Calculate total lessons and completed lessons across all modules
  const allLessons = modules.flatMap(module => module.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter(lesson => lesson.completed).length;
  
  // Find the next incomplete lesson
  const nextLesson = allLessons.find(lesson => !lesson.completed);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/student/dashboard/my-courses')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <Icon name="arrow-left-bold-duotone" size={20} />
        Back to My Courses
      </button>

      {/* Course Header */}
      <div className="card p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Icon name="user-bold-duotone" size={16} />
              <span>{course.instructor_name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-2">
              <Icon name="star-bold-duotone" size={16} className="text-yellow-500 fill-current" />
              <span className="font-medium">4.8</span>
              <span className="text-gray-500">(234 students)</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Icon name="calendar-bold-duotone" size={16} />
              <span>Started {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">{course.description}</p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Icon name="clock-circle-bold-duotone" size={20} className="text-blue-600" />
            <span className="text-gray-700">{totalLessons * 45} mins total</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="check-circle-bold-duotone" size={20} className="text-green-600" />
            <span className="text-gray-700">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="play-circle-bold-duotone" size={20} className="text-purple-600" />
            <span className="text-gray-700">{enrollment.progress}% complete</span>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Course Progress</span>
            <span className="text-sm font-medium text-gray-900">{enrollment.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-[#2727E6] h-3 rounded-full transition-all duration-300" 
              style={{ width: `${enrollment.progress}%` }}
            ></div>
          </div>
        </div>
        
        <button 
          onClick={() => nextLesson && handleLessonClick(nextLesson.id)}
          disabled={!nextLesson}
          className="gradient-button text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="play-circle-bold-duotone" size={20} />
          {nextLesson ? 'Continue Learning' : 'Course Complete!'}
        </button>
      </div>

      {/* Course Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Modules and Lessons List */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="card p-0 overflow-hidden">
                {/* Module Header */}
                <div 
                  className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
                  onClick={() => toggleModuleExpanded(module.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#2727E6] rounded-full flex items-center justify-center text-white font-semibold">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                      </div>
                    </div>
                    <Icon 
                      name={module.isExpanded ? "alt-arrow-up-bold-duotone" : "alt-arrow-down-bold-duotone"} 
                      size={20} 
                      className="text-gray-500"
                    />
                  </div>
                </div>
                
                {/* Module Lessons */}
                {module.isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {module.lessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          lesson.completed 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-blue-50'
                        }`}
                        onClick={() => handleLessonClick(lesson.id)}
                      >
                        <div className="flex items-center gap-4 pl-11">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            lesson.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {lesson.completed ? (
                              <Icon name="check-circle-bold-duotone" size={16} />
                            ) : (
                              <span className="text-xs font-semibold">{moduleIndex + 1}.{lesson.lesson_order}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Icon name="clock-circle-bold-duotone" size={14} />
                                {lesson.duration}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                video
                              </span>
                            </div>
                          </div>
                          
                          <Icon name="play-circle-bold-duotone" size={18} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Course Sidebar */}
        <div className="space-y-6">
          {/* Instructor Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Instructor</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#2727E6] rounded-full flex items-center justify-center text-white font-semibold">
                {course.instructor_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{course.instructor_name}</p>
                <p className="text-gray-600 text-sm">Course Instructor</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Expert instructor with years of experience in this subject area, 
              dedicated to helping students achieve their learning goals.
            </p>
            <button className="text-[#2727E6] hover:text-blue-700 font-medium text-sm">
              View Full Profile
            </button>
          </div>

          {/* Course Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Modules</span>
                <span className="font-medium">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Lessons</span>
                <span className="font-medium">{totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium text-green-600">{completedLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining</span>
                <span className="font-medium text-[#2727E6]">{totalLessons - completedLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Enrolled</span>
                <span className="font-medium">{new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                📝 Course Notes
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                💬 Ask AI Tutor
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                📊 View Progress
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                🎯 Set Reminder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCourse;