import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import LineChart from '../../components/analytics/LineChart';
import BarChart from '../../components/analytics/BarChart';
import StatCard from '../../components/analytics/StatCard';
import { AnalyticsService, TeacherAnalyticsOverview } from '../../services/analyticsService';

const TeacherAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<TeacherAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getTeacherAnalyticsOverview();
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
          <p className="text-gray-600 mb-4">Create your first course to see performance analytics</p>
          <button 
            onClick={() => navigate('/teacher/dashboard/create')}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Create Course
          </button>
        </div>
      </div>
    );
  }

  // Prepare revenue chart data
  const revenueData = analytics.revenueByMonth;
  const revenueLabels = revenueData.map(item => {
    const [year, month] = item.month.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });
  const revenueValues = revenueData.map(item => item.revenue);

  // Prepare students chart data
  const studentsData = analytics.studentsByMonth;
  const studentsLabels = studentsData.map(item => {
    const [year, month] = item.month.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });
  const studentsValues = studentsData.map(item => item.count);

  // Prepare course performance data
  const courseLabels = analytics.coursePerformance.map(course => course.title);
  const courseStudents = analytics.coursePerformance.map(course => course.students);
  const courseRevenue = analytics.coursePerformance.map(course => course.revenue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Analytics</h1>
        <p className="text-gray-600">Track your course performance and revenue</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toFixed(2)}`}
          icon="dollar-bold-duotone"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          change={{ value: 15, isPositive: true }}
          footer="vs. previous month"
        />
        <StatCard 
          title="Total Learners"
          value={analytics.totalStudents}
          icon="users-group-rounded-bold-duotone"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          change={{ value: 8, isPositive: true }}
          footer="vs. previous month"
        />
        <StatCard 
          title="Courses Created"
          value={analytics.totalCourses}
          icon="book-bookmark-bold-duotone"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          footer={`${analytics.totalCourses > 0 ? 'Active courses' : 'Create your first course'}`}
        />
        <StatCard 
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          icon="star-bold-duotone"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
          change={{ value: 0.2, isPositive: true }}
          footer="vs. previous month"
        />
      </div>

      {/* Revenue and Students Charts */}
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
            labels={studentsLabels}
            datasets={[
              {
                label: 'New Learners',
                data: studentsValues,
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

      {/* Course Details Table */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
          <button 
            onClick={() => navigate('/teacher/dashboard/my-courses')}
            className="text-[#2727E6] hover:text-blue-700 font-medium"
          >
            View All Courses
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Learners
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.coursePerformance.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.students}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${course.revenue.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.averageProgress.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icon name="star-bold-duotone" size={16} className="text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-900">{course.averageRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/teacher/dashboard/courses/${course.id}/analytics`)}
                      className="text-[#2727E6] hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;