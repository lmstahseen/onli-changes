import React from 'react';
import OnboardingModal from './OnboardingModal';
import Icon from '../common/Icon';

interface TeacherOnboardingProps {
  onClose: () => void;
}

const TeacherOnboarding: React.FC<TeacherOnboardingProps> = ({ onClose }) => {
  const steps = [
    {
      title: 'Welcome to Onliversity!',
      description: 'Your AI-powered teaching platform',
      icon: 'users-group-rounded-bold-duotone',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      content: (
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-[#2727E6] rounded-xl flex items-center justify-center">
              <Icon name="users-group-rounded-bold-duotone" size={48} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Welcome, Educator!</h2>
          <p className="text-gray-700 text-center">
            Onliversity empowers you to create engaging, AI-enhanced courses that reach learners worldwide. 
            Let's explore how you can leverage our platform to transform your teaching!
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <p className="text-blue-800 font-medium">
              This platform was built for the Bolt Hackathon and is currently free to use. All features are fully functional for you to explore and enjoy!
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Your Dashboard',
      description: 'Manage your courses and track performance',
      icon: 'home-smile-angle-bold-duotone',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-4 mb-4">
            <Icon name="home-smile-angle-bold-duotone" size={32} className="text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Instructor Dashboard</h3>
              <p className="text-gray-600 text-sm">Your teaching command center</p>
            </div>
          </div>
          <p className="text-gray-700">
            Your dashboard provides comprehensive insights and tools:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Track revenue, student enrollments, and course performance</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">View detailed analytics on student engagement and progress</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Access quick links to manage your courses and content</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Monitor your teaching impact and student satisfaction</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Course Management',
      description: 'Create and manage your courses',
      icon: 'book-bookmark-bold-duotone',
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="book-bookmark-bold-duotone" size={20} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">My Courses</h3>
              </div>
              <p className="text-gray-600 text-sm">Manage your existing courses and track their performance</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="add-square-bold-duotone" size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Create</h3>
              </div>
              <p className="text-gray-600 text-sm">Build new courses with AI assistance for content creation</p>
            </div>
          </div>
          <p className="text-gray-700">
            Our course management system makes it easy to create engaging content:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Organize content into modules and lessons for structured learning</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Create interactive video lessons with AI-powered tutors</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Generate quizzes and flashcards with AI assistance</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Set pricing and manage course visibility</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'AI-Powered Content Creation',
      description: 'Leverage AI to create engaging content',
      icon: 'brain-bold-duotone',
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-4 mb-4">
            <Icon name="brain-bold-duotone" size={32} className="text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900">AI Content Generation</h3>
              <p className="text-gray-600 text-sm">Create high-quality educational content with AI assistance</p>
            </div>
          </div>
          <p className="text-gray-700">
            Our AI tools help you create engaging educational content:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Generate comprehensive lesson scripts from your outlines</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Create assessment questions and quizzes automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Develop flashcards for key concepts with one click</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Enhance your content with AI suggestions and improvements</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Student Management & Analytics',
      description: 'Track student progress and engagement',
      icon: 'chart-bar-bold-duotone',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-4 mb-4">
            <Icon name="chart-bar-bold-duotone" size={32} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Analytics & Insights</h3>
              <p className="text-gray-600 text-sm">Understand student performance and course effectiveness</p>
            </div>
          </div>
          <p className="text-gray-700">
            Gain valuable insights into your teaching impact:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Track enrollment trends and revenue metrics</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Monitor student progress and completion rates</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Identify areas where students may be struggling</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Get AI-powered suggestions to improve your courses</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'You\'re All Set!',
      description: 'Start creating amazing courses',
      icon: 'check-circle-bold-duotone',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      content: (
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="check-circle-bold-duotone" size={48} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Education!</h2>
          <p className="text-gray-700 mb-6">
            You're now equipped to create engaging, AI-enhanced courses that will help learners worldwide achieve their goals.
          </p>
          <div className="bg-blue-50 p-6 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Icon name="info-circle-bold-duotone" size={20} className="text-blue-600" />
              Bolt Hackathon Special Access
            </h3>
            <p className="text-blue-700 mb-2">
              This platform was built for the Bolt Hackathon and is currently <span className="font-semibold">completely free</span> to use!
            </p>
            <p className="text-blue-700">
              All features are fully functional, and payment integration has been disabled to make testing easy. Enjoy creating courses and exploring everything Onliversity has to offer!
            </p>
          </div>
          <p className="text-gray-700 font-medium">
            Click "Get Started" to begin your journey as an Onliversity educator!
          </p>
        </div>
      )
    }
  ];

  return <OnboardingModal steps={steps} onClose={onClose} userType="teacher" />;
};

export default TeacherOnboarding;