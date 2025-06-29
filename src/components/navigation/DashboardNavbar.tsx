import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../common/Icon';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const DashboardNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const learnerNavItems: NavItem[] = [
    { icon: 'home-smile-angle-bold-duotone', label: 'Home', path: '/student/dashboard/home' },
    { icon: 'book-bookmark-bold-duotone', label: 'My Courses', path: '/student/dashboard/my-courses' },
    { icon: 'magnifer-zoom-in-bold-duotone', label: 'Explore', path: '/student/dashboard/explore' },
    { icon: 'user-rounded-bold-duotone', label: 'AI Tutor', path: '/student/dashboard/ai-tutor' },
    { icon: 'target-bold-duotone', label: 'Learning Path', path: '/student/dashboard/learning-path' },
    { icon: 'book-bookmark-bold-duotone', label: 'Certifications', path: '/student/dashboard/certifications' },
    { icon: 'user-bold-duotone', label: 'Profile', path: '/student/dashboard/profile' },
  ];

  const partnerNavItems: NavItem[] = [
    { icon: 'home-smile-angle-bold-duotone', label: 'Home', path: '/teacher/dashboard/home' },
    { icon: 'book-bookmark-bold-duotone', label: 'My Courses', path: '/teacher/dashboard/my-courses' },
    { icon: 'add-square-bold-duotone', label: 'Create', path: '/teacher/dashboard/create' },
    { icon: 'user-bold-duotone', label: 'Profile', path: '/teacher/dashboard/profile' },
  ];

  const navItems = user?.role === 'student' ? learnerNavItems : partnerNavItems;
  const roleLabel = user?.role === 'student' ? 'Learner' : 'Partner';

  // Mobile navigation items for student dashboard
  const mobileNavItems = [
    { icon: 'home-smile-angle-bold-duotone', label: 'Home', path: '/student/dashboard/home' },
    { icon: 'book-bookmark-bold-duotone', label: 'Courses', path: '/student/dashboard/my-courses' },
    { icon: 'magnifer-zoom-in-bold-duotone', label: 'Explore', path: '/student/dashboard/explore' },
    { icon: 'brain-bold-duotone', label: 'Learn', path: '/student/dashboard/ai-tutor' },
    { icon: 'medal-bold-duotone', label: 'Certifications', path: '/student/dashboard/certifications' },
  ];

  // Check if the current path is a "Learn" subpage
  const isLearnPage = location.pathname.includes('/student/dashboard/ai-tutor') || 
                      location.pathname.includes('/student/dashboard/learning-path');

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 navbar-blur h-16">
        <div className="px-4 h-full flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2727E6] rounded-lg flex items-center justify-center">
              <Icon name="book-bold-duotone" size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Onliversity</span>
          </div>

          {/* Mobile Menu Toggle - Only show for teacher dashboard on mobile */}
          {isMobile && user?.role === 'teacher' && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#2727E6]"
            >
              {isMobileMenuOpen ? (
                <Icon name="close-circle-bold-duotone" size={24} />
              ) : (
                <Icon name="hamburger-menu-bold-duotone" size={24} />
              )}
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-[#2727E6] rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:block font-medium">{user?.name || 'User'}</span>
              <Icon name="alt-arrow-down-bold-duotone" size={16} className="hidden md:block" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-sm font-medium text-[#2727E6]">{roleLabel}</p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate(user?.role === 'student' ? '/student/dashboard/profile' : '/teacher/dashboard/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Icon name="logout-2-line-duotone" size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Side Navbar - Desktop */}
      <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 hidden md:block overflow-y-auto">
        <div className="py-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-[#2727E6]/10 text-[#2727E6]'
                      : 'text-gray-700 hover:text-[#2727E6] hover:bg-gray-100'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Icon name="logout-2-line-duotone" size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Menu - For Teacher Dashboard */}
      {isMobileMenuOpen && user?.role === 'teacher' && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-16 left-0 bottom-0 w-64 bg-white overflow-y-auto">
            <div className="py-6 px-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'bg-[#2727E6]/10 text-[#2727E6]'
                          : 'text-gray-700 hover:text-[#2727E6] hover:bg-gray-100'
                      }`}
                    >
                      <Icon name={item.icon} size={20} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="logout-2-line-duotone" size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navbar (only for student dashboard) */}
      {user?.role === 'student' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
          <div className="flex justify-around items-center h-16">
            {mobileNavItems.map((item) => {
              // Special handling for "Learn" tab
              const isActive = item.path === '/student/dashboard/ai-tutor' 
                ? isLearnPage 
                : location.pathname === item.path;
                
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center p-2 ${
                    isActive ? 'text-[#2727E6]' : 'text-gray-600'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Learn Subpage Navigation (only for mobile) */}
      {isMobile && user?.role === 'student' && isLearnPage && (
        <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-30">
          <div className="flex justify-around items-center h-12">
            <button
              onClick={() => navigate('/student/dashboard/ai-tutor')}
              className={`px-4 py-2 font-medium text-sm ${
                location.pathname.includes('/student/dashboard/ai-tutor') 
                  ? 'text-[#2727E6] border-b-2 border-[#2727E6]' 
                  : 'text-gray-600'
              }`}
            >
              AI Tutor
            </button>
            <button
              onClick={() => navigate('/student/dashboard/learning-path')}
              className={`px-4 py-2 font-medium text-sm ${
                location.pathname.includes('/student/dashboard/learning-path') 
                  ? 'text-[#2727E6] border-b-2 border-[#2727E6]' 
                  : 'text-gray-600'
              }`}
            >
              Learning Path
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardNavbar;