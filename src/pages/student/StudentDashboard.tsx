import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardNavbar from '../../components/navigation/DashboardNavbar';

// Lazy load components to improve performance
const StudentHome = lazy(() => import('./StudentHome'));
const StudentMyCourses = lazy(() => import('./StudentMyCourses'));
const StudentExplore = lazy(() => import('./StudentExplore'));
const StudentAITutor = lazy(() => import('./StudentAITutor'));
const StudentLearningPath = lazy(() => import('./StudentLearningPath'));
const StudentPersonalLearningPathDetails = lazy(() => import('./StudentPersonalLearningPathDetails'));
const StudentPersonalPathLesson = lazy(() => import('./StudentPersonalPathLesson'));
const StudentCertifications = lazy(() => import('./StudentCertifications'));
const CertificationDetails = lazy(() => import('./CertificationDetails'));
const CertificationLesson = lazy(() => import('./CertificationLesson'));
const Certificate = lazy(() => import('./Certificate'));
const StudentProfile = lazy(() => import('./StudentProfile'));
const StudentCourse = lazy(() => import('./StudentCourse'));
const StudentLesson = lazy(() => import('./StudentLesson'));
const StudentPersonalLesson = lazy(() => import('./StudentPersonalLesson'));
const StudentCourseDetails = lazy(() => import('./StudentCourseDetails'));
const StudentPayment = lazy(() => import('./StudentPayment'));
const StudentPaymentSuccess = lazy(() => import('./StudentPaymentSuccess'));

// Loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const StudentDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      
      {/* Main Content with padding for fixed navbar and sidebar */}
      <div className="pt-16 md:pl-64 pb-20 md:pb-8">
        <Suspense fallback={<LoadingComponent />}>
          <Routes>
            <Route path="/" element={<Navigate to="home" replace />} />
            <Route path="home" element={<StudentHome />} />
            <Route path="my-courses" element={<StudentMyCourses />} />
            <Route path="explore" element={<StudentExplore />} />
            <Route path="ai-tutor" element={<StudentAITutor />} />
            <Route path="learning-path" element={<StudentLearningPath />} />
            <Route path="learning-path/personal/:id" element={<StudentPersonalLearningPathDetails />} />
            <Route path="personal-path-lessons/:id" element={<StudentPersonalPathLesson />} />
            <Route path="certifications" element={<StudentCertifications />} />
            <Route path="certification/:id" element={<CertificationDetails />} />
            <Route path="certification-lesson/:id" element={<CertificationLesson />} />
            <Route path="certificate/:id" element={<Certificate />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="courses/:id" element={<StudentCourse />} />
            <Route path="lessons/:id" element={<StudentLesson />} />
            <Route path="personal-lessons/:id" element={<StudentPersonalLesson />} />
            <Route path="course-details/:id" element={<StudentCourseDetails />} />
            <Route path="payment/:id" element={<StudentPayment />} />
            <Route path="payment-success" element={<StudentPaymentSuccess />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default StudentDashboard;