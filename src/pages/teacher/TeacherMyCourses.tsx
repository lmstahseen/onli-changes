import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CourseService, type EnrolledStudent } from '../../services/courseService';

interface CourseWithStats {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  price: number;
  category: string;
  difficulty: string;
  created_at: string;
  updated_at: string;
  student_count: number;
  revenue: number;
  lesson_count: number;
}

const TeacherMyCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStats | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Fetch courses with enrollment and lesson counts
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments(student_id),
          modules(lessons(id))
        `)
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Process courses with calculated stats
      const processedCourses: CourseWithStats[] = (coursesData || []).map(course => {
        const studentCount = course.enrollments?.length || 0;
        const revenue = studentCount * course.price;
        const lessonCount = course.modules?.reduce((sum: number, module: any) => sum + (module.lessons?.length || 0), 0) || 0;
        
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          instructor_name: course.instructor_name,
          price: course.price,
          category: course.category,
          difficulty: course.difficulty,
          created_at: course.created_at,
          updated_at: course.updated_at,
          student_count: studentCount,
          revenue: revenue,
          lesson_count: lessonCount
        };
      });

      setCourses(processedCourses);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledStudents = async (courseId: number) => {
    try {
      setLoadingStudents(true);
      
      // Fetch real student data using the CourseService
      const students = await CourseService.getEnrolledStudents(courseId);
      setEnrolledStudents(students);
      
    } catch (err) {
      console.error('Failed to load enrolled students:', err);
      setEnrolledStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleViewStudents = (course: CourseWithStats) => {
    setSelectedCourse(course);
    loadEnrolledStudents(course.id);
    setShowStudentsModal(true);
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return filter === 'published'; // All courses are published for now
  });

  const totalStudents = courses.reduce((sum, course) => sum + course.student_count, 0);
  const totalRevenue = courses.reduce((sum, course) => sum + course.revenue, 0);
  const publishedCourses = courses.length;

  const handleViewCourse = (courseId: number) => {
    navigate(`/teacher/dashboard/view-course/${courseId}`);
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/teacher/dashboard/edit-course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
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
            onClick={loadCourses}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-gray-600">Manage and track your course performance</p>
          </div>
          <button 
            onClick={() => navigate('/teacher/dashboard/create')}
            className="gradient-button text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <Icon name="add-square-bold-duotone" size={20} />
            Create New Course
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Icon name="book-bookmark-bold-duotone" size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-gray-600">Total Courses</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Icon name="eye-bold-duotone" size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{publishedCourses}</p>
              <p className="text-gray-600">Published</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Icon name="users-group-rounded-bold-duotone" size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-gray-600">Total Learners</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Icon name="dollar-bold-duotone" size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Courses' },
            { id: 'published', label: 'Published' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-[#2727E6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="card p-8">
            <Icon name="book-bookmark-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't created any courses yet." 
                : `No ${filter} courses found.`}
            </p>
            <button 
              onClick={() => navigate('/teacher/dashboard/create')}
              className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
            >
              Create Your First Course
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card p-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Published
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Icon name="menu-dots-vertical-bold-duotone" size={20} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-semibold text-gray-900">${course.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-semibold text-gray-900 capitalize">{course.category.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Difficulty</p>
                      <p className="font-semibold text-gray-900 capitalize">{course.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Learners</p>
                      <p className="font-semibold text-gray-900">{course.student_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lessons</p>
                      <p className="font-semibold text-gray-900">{course.lesson_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold text-gray-900">${course.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(course.created_at).toLocaleDateString()} • 
                      Updated: {new Date(course.updated_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewCourse(course.id)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Icon name="eye-bold-duotone" size={16} />
                        View
                      </button>
                      <button 
                        onClick={() => handleEditCourse(course.id)}
                        className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                      >
                        <Icon name="pen-bold-duotone" size={16} />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleViewStudents(course)}
                        className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                      >
                        <Icon name="users-group-rounded-bold-duotone" size={16} />
                        View Learners
                      </button>
                      <button className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
                        <Icon name="trash-bin-trash-bold-duotone" size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Summary */}
      {courses.length > 0 && (
        <div className="mt-12 card p-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Performance Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Top Performing Course</h4>
              <p className="text-gray-700">
                {courses.sort((a, b) => b.student_count - a.student_count)[0]?.title || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                {courses[0]?.student_count || 0} learners enrolled
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Average Course Price</h4>
              <p className="text-gray-700">
                ${courses.length > 0 ? (courses.reduce((sum, c) => sum + c.price, 0) / courses.length).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-gray-600">
                Across {courses.length} courses
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Total Content</h4>
              <p className="text-gray-700">
                {courses.reduce((sum, c) => sum + c.lesson_count, 0)} lessons
              </p>
              <p className="text-sm text-gray-600">
                Across all courses
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Students Modal */}
      {showStudentsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Enrolled Learners - {selectedCourse.title}
              </h3>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon name="close-circle-bold-duotone" size={24} />
              </button>
            </div>
            
            {loadingStudents ? (
              <div className="py-12 text-center">
                <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading enrolled learners...</p>
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="py-12 text-center">
                <Icon name="users-group-rounded-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No learners enrolled yet</h4>
                <p className="text-gray-600">
                  When learners enroll in this course, they will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-gray-600">
                    {enrolledStudents.length} {enrolledStudents.length === 1 ? 'learner' : 'learners'} enrolled
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Learner
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enrolled On
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrolledStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-[#2727E6] flex items-center justify-center text-white font-semibold">
                                  {student.name.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(student.enrolled_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                                <div 
                                  className="bg-[#2727E6] h-2 rounded-full" 
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">{student.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-[#2727E6] hover:text-blue-800">
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMyCourses;