import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import LineChart from '../../components/analytics/LineChart';
import BarChart from '../../components/analytics/BarChart';
import DoughnutChart from '../../components/analytics/DoughnutChart';
import StatCard from '../../components/analytics/StatCard';
import ProgressBar from '../../components/analytics/ProgressBar';
import { AnalyticsService, StudentAnalyticsOverview } from '../../services/analyticsService';

const StudentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<StudentAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getStudentAnalyticsOverview();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading analytics data...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadAnalytics}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="chart-bar-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600 mb-4">Start learning to see your progress analytics</p>
          <button 
            onClick={() => navigate('/student/dashboard/explore')}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Explore Courses
          </button>
        </div>
      </div>
    );
  }

  // Prepare activity chart data
  const activityData = analytics.activityData;
  const activityLabels = activityData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const activityCounts = activityData.map(item => item.count);

  // Prepare course progress chart data
  const courseLabels = analytics.enrolledCourses.map(course => course.title);
  const courseProgress = analytics.enrolledCourses.map(course => course.progress);

  // Prepare quiz performance data (mock data for now)
  const quizLabels = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
  const quizData = [
    Math.round(analytics.averageQuizScore * 0.4), 
    Math.round(analytics.averageQuizScore * 0.3), 
    Math.round(analytics.averageQuizScore * 0.2), 
    Math.round(analytics.averageQuizScore * 0.1)
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
        <p className="text-gray-600">Track your progress and learning performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Lessons Completed"
          value={analytics.totalLessonsCompleted}
          icon="book-check-bold-duotone"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          change={{ value: 12, isPositive: true }}
          footer="vs. previous month"
        />
        <StatCard 
          title="Study Hours"
          value={analytics.totalStudyHours}
          icon="clock-circle-bold-duotone"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          change={{ value: 8, isPositive: true }}
          footer="vs. previous month"
        />
        <StatCard 
          title="Average Quiz Score"
          value={`${Math.round(analytics.averageQuizScore)}%`}
          icon="medal-bold-duotone"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
          change={{ value: 5, isPositive: true }}
          footer="vs. previous month"
        />
        <StatCard 
          title="Current Streak"
          value={`${analytics.streakDays} days`}
          icon="fire-bold-duotone"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          footer="Keep learning daily!"
        />
      </div>

      {/* Activity and Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Learning Activity</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'week' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'month' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  timeRange === 'year' 
                    ? 'bg-[#2727E6] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Year
              </button>
            </div>
          </div>
          <LineChart 
            title=""
            labels={activityLabels}
            datasets={[
              {
                label: 'Lessons Completed',
                data: activityCounts,
                borderColor: '#2727E6',
                backgroundColor: 'rgba(39, 39, 230, 0.1)',
                fill: true
              }
            ]}
            height={250}
          />
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Progress</h2>
          <BarChart 
            title=""
            labels={courseLabels}
            datasets={[
              {
                label: 'Progress (%)',
                data: courseProgress,
                backgroundColor: '#2727E6',
              }
            ]}
            height={250}
          />
        </div>
      </div>

      {/* Course Progress and Quiz Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Progress Details</h2>
          <div className="space-y-6">
            {analytics.enrolledCourses.map(course => (
              <div key={course.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <span className="text-sm text-gray-500">
                    Last activity: {new Date(course.lastActivity).toLocaleDateString()}
                  </span>
                </div>
                <ProgressBar 
                  value={course.progress} 
                  maxValue={100} 
                  color="#2727E6"
                />
                <div className="flex justify-end">
                  <button 
                    onClick={() => navigate(`/student/dashboard/courses/${course.id}`)}
                    className="text-sm text-[#2727E6] hover:text-blue-800 font-medium"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Performance</h2>
          <DoughnutChart 
            title=""
            labels={quizLabels}
            data={quizData}
            backgroundColor={['#10B981', '#3B82F6', '#F59E0B', '#EF4444']}
            height={250}
          />
          <div className="mt-4 text-center">
            <p className="text-gray-600">Average Score: <span className="font-semibold text-gray-900">{Math.round(analytics.averageQuizScore)}%</span></p>
          </div>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Recommendations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Based on Your Progress</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Complete the remaining lessons in "{analytics.enrolledCourses[0]?.title || 'your current course'}" to earn your certificate</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Review quiz questions you've missed to improve your understanding</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Maintain your {analytics.streakDays}-day learning streak for consistent progress</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Suggested Next Steps</h3>
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
      </div>
    </div>
  );
};

export default StudentAnalytics;