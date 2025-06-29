import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface TeacherStats {
  coursesCreated: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

interface CoursePerformance {
  id: number;
  title: string;
  students: number;
  rating: number;
  revenue: number;
  status: string;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  icon: string;
  color: string;
}

const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    expertise: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    education: ''
  });

  const [stats, setStats] = useState<TeacherStats>({
    coursesCreated: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  const [courses, setCourses] = useState<CoursePerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Load teacher's courses with enrollment data
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          created_at,
          enrollments(student_id)
        `)
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Process courses and calculate stats
      const processedCourses: CoursePerformance[] = (coursesData || []).map(course => {
        const studentCount = course.enrollments?.length || 0;
        const revenue = studentCount * course.price;
        
        return {
          id: course.id,
          title: course.title,
          students: studentCount,
          rating: 4.8, // Would be calculated from actual reviews
          revenue: revenue,
          status: 'published'
        };
      });

      setCourses(processedCourses);

      // Calculate overall stats
      const totalCourses = processedCourses.length;
      const totalStudents = processedCourses.reduce((sum, course) => sum + course.students, 0);
      const totalRevenue = processedCourses.reduce((sum, course) => sum + course.revenue, 0);
      const averageRating = processedCourses.length > 0 
        ? processedCourses.reduce((sum, course) => sum + course.rating, 0) / processedCourses.length 
        : 0;

      setStats({
        coursesCreated: totalCourses,
        totalStudents,
        totalRevenue,
        averageRating
      });

      // Generate recent activity
      const activities: RecentActivity[] = [];

      // Add course creation activities
      processedCourses.slice(0, 2).forEach((course) => {
        activities.push({
          id: `course-${course.id}`,
          type: 'course_published',
          title: `Published "${course.title}"`,
          date: new Date().toISOString(),
          icon: 'book-bookmark-bold-duotone',
          color: 'text-blue-600'
        });
      });

      // Add enrollment activity
      if (totalStudents > 0) {
        activities.push({
          id: 'enrollments',
          type: 'student_enrolled',
          title: `${totalStudents} students enrolled this month`,
          date: new Date().toISOString(),
          icon: 'users-group-rounded-bold-duotone',
          color: 'text-green-600'
        });
      }

      // Add revenue activity
      if (totalRevenue > 0) {
        activities.push({
          id: 'revenue',
          type: 'revenue_generated',
          title: `Generated $${totalRevenue.toFixed(2)} in revenue`,
          date: new Date().toISOString(),
          icon: 'dollar-bold-duotone',
          color: 'text-purple-600'
        });
      }

      setRecentActivity(activities.slice(0, 3));

      // Set default profile data
      setFormData(prev => ({
        ...prev,
        bio: prev.bio || 'Experienced educator passionate about sharing knowledge and helping students achieve their learning goals through innovative teaching methods.',
        expertise: prev.expertise || 'Education, Online Learning, Course Development',
        location: prev.location || 'Global (Online)',
        education: prev.education || 'Advanced degree in Education'
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would save to the backend
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading profile...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadProfileData}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Profile</h1>
        <p className="text-gray-600">Manage your teaching profile and track your performance</p>
      </div>

      {/* Profile Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-[#2727E6] rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {user?.name?.charAt(0) || 'I'}
            </div>
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Icon name="camera-bold-duotone" size={16} className="text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
                )}
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Icon name="letter-bold-duotone" size={16} />
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    <span>{formData.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Icon name="user-bold-duotone" size={16} />
                  <span>Instructor</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="gradient-button text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon name="pen-bold-duotone" size={16} />
                    Edit Profile
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon name="settings-bold-duotone" size={16} />
                  Settings
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
                />
              ) : (
                <p className="text-gray-600">{formData.bio}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Expertise:</strong> {formData.expertise}
              </div>
              <div>
                <strong>Location:</strong> {formData.location}
              </div>
              <div>
                <strong>Education:</strong> {formData.education}
              </div>
              <div>
                <strong>Teaching since:</strong> {new Date(user?.created_at || Date.now()).getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <Icon name="book-bookmark-bold-duotone" size={32} className="text-blue-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.coursesCreated}</p>
          <p className="text-gray-600 text-sm">Courses Created</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="users-group-rounded-bold-duotone" size={32} className="text-green-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
          <p className="text-gray-600 text-sm">Total Students</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="dollar-bold-duotone" size={32} className="text-purple-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-gray-600 text-sm">Total Revenue</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="star-bold-duotone" size={32} className="text-yellow-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
          <p className="text-gray-600 text-sm">Avg. Rating</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Course Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="book-bookmark-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{course.students} students</span>
                      <span>⭐ {course.rating}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        {course.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${course.revenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="calendar-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center ${activity.color}`}>
                    <Icon name={activity.icon} size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{activity.title}</p>
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

      {/* Professional Information */}
      {isEditing && (
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expertise Areas</label>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Instructor Benefits */}
      <div className="mt-8 card p-8 bg-gradient-to-r from-purple-50 to-blue-50">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🎓 Instructor Benefits</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Monetize Your Expertise</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Earn revenue from course sales</li>
              <li>• Set your own pricing strategy</li>
              <li>• Build a passive income stream</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">AI-Powered Teaching</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Generate lesson content with AI assistance</li>
              <li>• Create interactive video avatars</li>
              <li>• Personalized learning experiences for students</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;