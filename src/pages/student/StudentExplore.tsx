import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CourseService, type Course } from '../../services/courseService';

const StudentExplore: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Courses' },
    { id: 'technology', name: 'Technology' },
    { id: 'science', name: 'Science' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'arts-humanities', name: 'Arts & Humanities' },
    { id: 'business', name: 'Business' },
    { id: 'health-medicine', name: 'Health & Medicine' },
    { id: 'language-learning', name: 'Language Learning' },
    { id: 'personal-development', name: 'Personal Development' }
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const allCourses = await CourseService.getAllCoursesWithEnrollmentStatus();
      setCourses(allCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewCourse = (courseId: number) => {
    navigate(`/student/dashboard/course-details/${courseId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading courses...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Courses</h1>
        <p className="text-gray-600">Discover new skills and expand your knowledge</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Icon name="magnifier-bold-duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search courses, instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Icon name="filter-bold-duotone" size={20} />
            Filters
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#2727E6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Course Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="card p-6">
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                <div className="bg-white px-2 py-1 rounded text-sm font-semibold text-green-600">
                  ${course.price}
                </div>
              </div>
              {course.is_enrolled && (
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold inline-block">
                  Enrolled
                </div>
              )}
              <p className="text-gray-600 mb-2">{course.instructor_name}</p>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
            </div>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Icon name="star-bold-duotone" size={16} className="text-yellow-500" />
                <span>4.8</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="users-group-rounded-bold-duotone" size={16} />
                <span>{course.student_count || 0} students</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="clock-circle-bold-duotone" size={16} />
                <span className="capitalize">{course.difficulty}</span>
              </div>
            </div>
            
            <button 
              onClick={() => handleViewCourse(course.id)}
              className="gradient-button text-white px-6 py-2 rounded-lg font-medium w-full flex items-center justify-center gap-2"
            >
              <Icon name="eye-bold-duotone" size={16} />
              View Course
            </button>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <div className="card p-8">
            <Icon name="magnifier-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or browse different categories
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExplore;