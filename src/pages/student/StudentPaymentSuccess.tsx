import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Play, Home, Download } from 'lucide-react';

const StudentPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseTitle, courseId, amount } = location.state || {};

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/student/dashboard/my-courses');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoToCourse = () => {
    navigate(`/student/dashboard/courses/${courseId}`);
  };

  const handleGoToMyCourses = () => {
    navigate('/student/dashboard/my-courses');
  };

  const handleGoHome = () => {
    navigate('/student/dashboard/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Congratulations! You have successfully enrolled in the course.
          </p>

          {/* Course Details */}
          {courseTitle && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">{courseTitle}</h3>
              {amount && (
                <p className="text-green-600 font-medium">Amount: ${amount}</p>
              )}
              <p className="text-sm text-gray-600 mt-2">
                You now have lifetime access to this course
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {courseId && (
              <button
                onClick={handleGoToCourse}
                className="w-full gradient-button text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Play size={20} />
                Start Learning Now
              </button>
            )}
            
            <button
              onClick={handleGoToMyCourses}
              className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              View My Courses
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Go to Dashboard
            </button>
          </div>

          {/* Auto-redirect Notice */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              You will be automatically redirected to "My Courses" in 10 seconds
            </p>
          </div>

          {/* What's Next */}
          <div className="mt-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Access your course anytime from "My Courses"</li>
              <li>• Interact with AI tutors for each lesson</li>
              <li>• Track your progress and earn certificates</li>
              <li>• Download course materials for offline study</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPaymentSuccess;