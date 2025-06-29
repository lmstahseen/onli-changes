import React from 'react';
import OnboardingModal from './OnboardingModal';
import Icon from '../common/Icon';

interface StudentOnboardingProps {
  onClose: () => void;
}

const StudentOnboarding: React.FC<StudentOnboardingProps> = ({ onClose }) => {
  const steps = [
    {
      title: 'Welcome to Onliversity!',
      description: 'Your AI-powered learning platform',
      icon: 'book-bold-duotone',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      content: (
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-[#2727E6] rounded-xl flex items-center justify-center">
              <Icon name="book-bold-duotone" size={48} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Welcome to Your Learning Journey!</h2>
          <p className="text-gray-700 text-center">
            Onliversity is an AI-powered learning platform designed to provide you with a personalized educational experience. 
            Let's take a quick tour to help you get started!
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
      description: 'Track your progress and continue learning',
      icon: 'home-smile-angle-bold-duotone',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-4 mb-4">
            <Icon name="home-smile-angle-bold-duotone" size={32} className="text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Home Dashboard</h3>
              <p className="text-gray-600 text-sm">Your learning command center</p>
            </div>
          </div>
          <p className="text-gray-700">
            Your dashboard provides an overview of your learning journey:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Track your progress across all courses</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">View your learning statistics and achievements</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Continue where you left off with one click</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Access quick links to all platform features</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Courses & Learning',
      description: 'Explore and enroll in courses',
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
              <p className="text-gray-600 text-sm">Access your enrolled courses and track your progress</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="magnifer-zoom-in-bold-duotone" size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Explore</h3>
              </div>
              <p className="text-gray-600 text-sm">Discover new courses across various subjects and difficulty levels</p>
            </div>
          </div>
          <p className="text-gray-700">
            Onliversity offers a wide range of courses with interactive lessons:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Interactive video lessons with AI tutors</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Quizzes to test your knowledge</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Flashcards for effective memorization</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Note-taking tools for each lesson</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'AI Tutor & Learning Paths',
      description: 'Personalized learning experiences',
      icon: 'brain-bold-duotone',
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="brain-bold-duotone" size={20} className="text-orange-600" />
                <h3 className="font-semibold text-gray-900">AI Tutor</h3>
              </div>
              <p className="text-gray-600 text-sm">Generate personalized lessons on any topic with AI assistance</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="target-bold-duotone" size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Learning Paths</h3>
              </div>
              <p className="text-gray-600 text-sm">Follow AI-generated learning paths tailored to your specific goals</p>
            </div>
          </div>
          <p className="text-gray-700">
            Our AI-powered features take personalization to the next level:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Create custom lessons on any topic you want to learn</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Generate comprehensive learning paths for specific goals</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Interact with AI video tutors for a human-like learning experience</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Upload documents for context-aware personalized learning</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Certifications',
      description: 'Earn credentials for your achievements',
      icon: 'medal-bold-duotone',
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-yellow-100',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-4 mb-4">
            <Icon name="medal-bold-duotone" size={32} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Certifications</h3>
              <p className="text-gray-600 text-sm">Earn verifiable credentials for your skills</p>
            </div>
          </div>
          <p className="text-gray-700">
            Showcase your achievements with Onliversity certifications:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Complete certification programs in various subjects</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Receive beautifully designed certificates</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Share your achievements on LinkedIn and other platforms</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Verify your skills with unique certification codes</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'You\'re All Set!',
      description: 'Start your learning journey',
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">You're Ready to Begin!</h2>
          <p className="text-gray-700 mb-6">
            You now have all the tools you need to start your personalized learning journey with Onliversity.
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
              All features are fully functional, and payment integration has been disabled to make testing easy. Enjoy exploring everything Onliversity has to offer!
            </p>
          </div>
          <p className="text-gray-700 font-medium">
            Click "Get Started" to begin exploring Onliversity!
          </p>
        </div>
      )
    }
  ];

  return <OnboardingModal steps={steps} onClose={onClose} userType="student" />;
};

export default StudentOnboarding;