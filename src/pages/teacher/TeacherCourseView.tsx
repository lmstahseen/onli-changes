import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CourseService, type CourseDetails } from '../../services/courseService';

const TeacherCourseView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    if (id) {
      loadCourseDetails(id);
    }
  }, [id]);

  const loadCourseDetails = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const details = await CourseService.getCourseDetails(courseId);
      setCourseDetails(details);
      
      // Initialize all modules as expanded
      const initialExpandedState: {[key: number]: boolean} = {};
      details.modules.forEach(module => {
        initialExpandedState[module.id] = true;
      });
      setExpandedModules(initialExpandedState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleExpanded = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleEditCourse = () => {
    navigate(`/teacher/dashboard/edit-course/${id}`);
  };

  const handleBackToCourses = () => {
    navigate('/teacher/dashboard/my-courses');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !courseDetails) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error || 'Course not found'}</p>
          <button 
            onClick={handleBackToCourses}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  const { course, modules } = courseDetails;
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={handleBackToCourses}
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
              <Icon name="users-group-rounded-bold-duotone" size={16} />
              <span>By {course.instructor_name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 mb-2">${course.price}</div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Published
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">{course.description}</p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Icon name="book-bookmark-bold-duotone" size={20} className="text-blue-600" />
            <span className="text-gray-700">{totalLessons} lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="clock-circle-bold-duotone" size={20} className="text-green-600" />
            <span className="text-gray-700 capitalize">{course.difficulty} level</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="medal-bold-duotone" size={20} className="text-purple-600" />
            <span className="text-gray-700">Certificate included</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            <Icon name="star-bold-duotone" size={20} className="text-yellow-500 fill-current" />
            <span className="font-medium">4.8</span>
            <span className="text-gray-500">(234 reviews)</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="users-group-rounded-bold-duotone" size={20} className="text-gray-500" />
            <span className="text-gray-700">{course.student_count || 0} students enrolled</span>
          </div>
        </div>
        
        <button 
          onClick={handleEditCourse}
          className="gradient-button text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <Icon name="pen-bold-duotone" size={20} />
          Edit Course
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
          <div className="space-y-4">
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
                      name={expandedModules[module.id] ? "alt-arrow-up-bold-duotone" : "alt-arrow-down-bold-duotone"} 
                      size={20} 
                      className="text-gray-500"
                    />
                  </div>
                </div>
                
                {/* Module Lessons */}
                {expandedModules[module.id] && (
                  <div className="divide-y divide-gray-100">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div 
                        key={lesson.id} 
                        className="p-4"
                      >
                        <div className="flex items-center gap-4 pl-11">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            <span className="text-xs">{moduleIndex + 1}.{lessonIndex + 1}</span>
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
                          
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
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
          {/* Course Performance */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Students</span>
                <span className="font-medium">{course.student_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium text-green-600">${((course.student_count || 0) * course.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rating</span>
                <span className="font-medium">4.8 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium">87%</span>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Modules</span>
                <span className="font-medium">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lessons</span>
                <span className="font-medium">{totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{totalLessons * 45} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Level</span>
                <span className="font-medium capitalize">{course.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium capitalize">{course.category.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={handleEditCourse}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ✏️ Edit Course Content
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                📊 View Analytics
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                💬 Student Messages
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                📝 Course Reviews
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseView;