import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardNavbar from '../../components/navigation/DashboardNavbar';

// Lazy load components to improve performance
const TeacherHome = lazy(() => import('./TeacherHome'));
const TeacherMyCourses = lazy(() => import('./TeacherMyCourses'));
const TeacherCreate = lazy(() => import('./TeacherCreate'));
const TeacherProfile = lazy(() => import('./TeacherProfile'));
const TeacherCourseView = lazy(() => import('./TeacherCourseView'));
const TeacherCourseEdit = lazy(() => import('./TeacherCourseEdit'));
const TeacherCourseAnalytics = lazy(() => import('./TeacherCourseAnalytics'));

// Loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const TeacherDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      
      {/* Main Content with padding for fixed navbar and sidebar */}
      <div className="pt-16 md:pl-64 pb-20 md:pb-8">
        <Suspense fallback={<LoadingComponent />}>
          <Routes>
            <Route path="/" element={<Navigate to="home" replace />} />
            <Route path="home" element={<TeacherHome />} />
            <Route path="my-courses" element={<TeacherMyCourses />} />
            <Route path="create" element={<TeacherCreate />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="courses/:id/analytics" element={<TeacherCourseAnalytics />} />
            <Route path="view-course/:id" element={<TeacherCourseView />} />
            <Route path="edit-course/:id" element={<TeacherCourseEdit />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default TeacherDashboard;