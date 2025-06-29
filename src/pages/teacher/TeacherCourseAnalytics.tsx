import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import LineChart from '../../components/analytics/LineChart';
import BarChart from '../../components/analytics/BarChart';
import DoughnutChart from '../../components/analytics/DoughnutChart';
import StatCard from '../../components/analytics/StatCard';
import ProgressBar from '../../components/analytics/ProgressBar';
import { AnalyticsService, CourseAnalytics } from '../../services/analyticsService';

const TeacherCourseAnalytics: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (id) {
      loadAnalytics(id);
    }
  }, [id]);

  const loadAnalytics = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getCourseAnalytics(courseId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course analytics');
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
            <p className="text-gray-600">Loading course analytics...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/teacher/dashboard/analytics')}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Analytics
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Course Analytics</h2>
          <p className="text-gray-600 mb-4">This course doesn't have any analytics data yet</p>
          <button 
            onClick={() => navigate('/teacher/dashboard/analytics')}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Analytics
          </button>
        </div>
      </div>
    );
  }

  // Prepare enrollment trend data
  const enrollmentData = analytics.enrollmentTrend;
  const enrollmentLabels = enrollmentData.map(item => {
    const [year, month] = item.date.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });
  const enrollmentCounts = enrollmentData.map(item => item.count);

  // Prepare progress distribution data
  const progressLabels = analytics.progressDistribution.map(item => item.range);
  const progressCounts = analytics.progressDistribution.map(item => item.count);

  // Prepare lesson completion data
  const lessonLabels = analytics.lessonCompletionRates.map(item => item.lessonTitle);
  const completionRates = analytics.lessonCompletionRates.map(item => item.completionRate);
  const quizScores = analytics.lessonCompletionRates.map(item => item.averageQuizScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/teacher/dashboard/analytics')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <Icon name="arrow-left-bold-duotone" size={20} />
        Back to Analytics
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{analytics.title} - Analytics</h1>
        <p className="text-gray-600">Detailed performance metrics for this course</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Learners"
          value={analytics.totalStudents}
          icon="users-group-rounded-bold-duotone"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard 
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toFixed(2)}`}
          icon="dollar-bold-duotone"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard 
          title="Average Progress"
          value={`${Math.round(analytics.averageProgress)}%`}
          icon="chart-bar-bold-duotone"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard 
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          icon="star-bold-duotone"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
      </div>

      {/* Enrollment Trend and Progress Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Enrollment Trend</h2>
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
                data: enrollmentCounts,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
              }
            ]}
            height={250}
          />
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Learner Progress Distribution</h2>
          <DoughnutChart 
            title=""
            labels={progressLabels}
            data={progressCounts}
            backgroundColor={['#EF4444', '#F59E0B', '#3B82F6', '#10B981']}
            height={250}
          />
        </div>
      </div>

      {/* Lesson Completion Rates */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Lesson Performance</h2>
        <BarChart 
          title=""
          labels={lessonLabels}
          datasets={[
            {
              label: 'Completion Rate (%)',
              data: completionRates,
              backgroundColor: '#3B82F6',
            },
            {
              label: 'Avg. Quiz Score (%)',
              data: quizScores,
              backgroundColor: '#10B981',
            }
          ]}
          height={300}
        />
      </div>

      {/* Lesson Details Table */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Lesson Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Quiz Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.lessonCompletionRates.map((lesson) => (
                <tr key={lesson.lessonId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lesson.lessonTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-48">
                      <ProgressBar 
                        value={lesson.completionRate} 
                        maxValue={100} 
                        showPercentage={false}
                        height={6}
                      />
                      <div className="text-xs text-gray-500 mt-1">{Math.round(lesson.completionRate)}% completed</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-48">
                      <ProgressBar 
                        value={lesson.averageQuizScore} 
                        maxValue={100} 
                        color="#10B981"
                        showPercentage={false}
                        height={6}
                      />
                      <div className="text-xs text-gray-500 mt-1">{Math.round(lesson.averageQuizScore)}% average score</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lesson.completionRate > 75 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Good
                      </span>
                    ) : lesson.completionRate > 50 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Average
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Needs Attention
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Improvement Suggestions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Based on Learner Performance</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Consider revising lessons with low completion rates to improve engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Add more examples and practice questions to lessons with low quiz scores</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Consider breaking down complex lessons into smaller, more digestible modules</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Growth Opportunities</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Create follow-up or advanced courses to build on this course's success</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Encourage learners to leave reviews to improve course visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Consider offering a discount or promotion to increase enrollments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseAnalytics;