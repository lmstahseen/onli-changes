import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, BookOpen, Award, Target, Settings, Camera, Edit, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface StudentStats {
  coursesEnrolled: number;
  certificatesEarned: number;
  learningHours: number;
  streakDays: number;
}

interface RecentActivity {
  id: string;
  type: 'course_completed' | 'lesson_finished' | 'ai_lesson' | 'enrollment';
  title: string;
  date: string;
  icon: any;
  color: string;
}

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    learningGoals: ''
  });

  const [stats, setStats] = useState<StudentStats>({
    coursesEnrolled: 0,
    certificatesEarned: 0,
    learningHours: 0,
    streakDays: 0
  });

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

      // Load student's enrollments and progress
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          progress,
          enrolled_at,
          courses!inner (
            id,
            title,
            instructor_name
          )
        `)
        .eq('student_id', user.id);

      if (enrollmentError) throw enrollmentError;

      // Load lesson progress
      const { data: lessonProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('completed, completed_at')
        .eq('student_id', user.id)
        .eq('completed', true);

      if (progressError) throw progressError;

      // Load personal lessons
      const { data: personalLessons, error: personalError } = await supabase
        .from('student_personal_lessons')
        .select('id, title, created_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (personalError) throw personalError;

      // Calculate stats
      const coursesEnrolled = enrollments?.length || 0;
      const completedCourses = enrollments?.filter(e => e.progress === 100).length || 0;
      const completedLessons = lessonProgress?.length || 0;
      const learningHours = Math.round(completedLessons * 0.75); // Estimate 45 minutes per lesson
      const streakDays = calculateStreakDays(lessonProgress || []);

      setStats({
        coursesEnrolled,
        certificatesEarned: completedCourses,
        learningHours,
        streakDays
      });

      // Generate recent activity
      const activities: RecentActivity[] = [];

      // Add completed courses
      enrollments?.filter(e => e.progress === 100).slice(0, 2).forEach(enrollment => {
        activities.push({
          id: `course-${enrollment.courses.id}`,
          type: 'course_completed',
          title: `Completed "${enrollment.courses.title}"`,
          date: enrollment.enrolled_at,
          icon: Award,
          color: 'text-yellow-600'
        });
      });

      // Add recent lesson completions
      if (completedLessons > 0) {
        activities.push({
          id: 'lessons',
          type: 'lesson_finished',
          title: `Completed ${completedLessons} lessons`,
          date: new Date().toISOString(),
          icon: BookOpen,
          color: 'text-blue-600'
        });
      }

      // Add AI lessons
      personalLessons?.forEach(lesson => {
        activities.push({
          id: `ai-${lesson.id}`,
          type: 'ai_lesson',
          title: `Generated AI lesson on "${lesson.title}"`,
          date: lesson.created_at,
          icon: Target,
          color: 'text-purple-600'
        });
      });

      // Sort by date and take top 3
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 3));

      // Set default profile data
      setFormData(prev => ({
        ...prev,
        bio: prev.bio || 'Passionate learner exploring new technologies and expanding my knowledge through AI-powered education.',
        location: prev.location || 'Global',
        learningGoals: prev.learningGoals || 'Master new skills and advance my career through continuous learning'
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreakDays = (progressData: any[]): number => {
    if (!progressData.length) return 0;
    
    // Simple streak calculation - count consecutive days with completed lessons
    const completionDates = progressData
      .map(p => new Date(p.completed_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < completionDates.length; i++) {
      const currentDate = new Date(completionDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings and track your learning progress</p>
      </div>

      {/* Profile Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Camera size={16} className="text-gray-600" />
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
                  <Mail size={16} />
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
                    <Edit size={16} />
                    Edit Profile
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings size={16} />
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
                <strong>Location:</strong> {formData.location}
              </div>
              <div>
                <strong>Member since:</strong> {new Date(user?.created_at || Date.now()).toLocaleDateString()}
              </div>
              <div>
                <strong>Learning Goals:</strong> {formData.learningGoals}
              </div>
              <div>
                <strong>Time Zone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.coursesEnrolled}</p>
          <p className="text-gray-600 text-sm">Courses Enrolled</p>
        </div>
        <div className="card p-6 text-center">
          <Award className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.certificatesEarned}</p>
          <p className="text-gray-600 text-sm">Certificates Earned</p>
        </div>
        <div className="card p-6 text-center">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.learningHours}</p>
          <p className="text-gray-600 text-sm">Learning Hours</p>
        </div>
        <div className="card p-6 text-center">
          <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{stats.streakDays}</p>
          <p className="text-gray-600 text-sm">Streak Days</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center ${activity.color}`}>
                    <activity.icon size={16} />
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

        {/* Account Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-gray-500 text-sm">Receive updates about your courses</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Course Reminders</p>
                <p className="text-gray-500 text-sm">Get reminded about pending lessons</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-gray-500 text-sm">Receive news and promotional content</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      {isEditing && (
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
          <div className="grid md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
              <input
                type="text"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;