import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';

const LandingNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <nav className="fixed top-5 left-0 right-0 z-50 px-[30px] mx-auto">
      <div className={`max-w-7xl mx-auto rounded-xl backdrop-blur-md transition-all duration-300 border border-gray-200 ${
        isScrolled ? 'bg-white/85 shadow-soft' : 'bg-white/70'
      }`}>
        <div className="flex justify-between items-center h-[4.5rem] px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2727E6] rounded-lg flex items-center justify-center">
              <Icon name="book-bold" size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Onliversity</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-[#2727E6] font-medium transition-colors">Home</a>
            <a href="#about" className="text-gray-700 hover:text-[#2727E6] font-medium transition-colors">About</a>
            <a href="#features" className="text-gray-700 hover:text-[#2727E6] font-medium transition-colors">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-[#2727E6] font-medium transition-colors">Pricing</a>
            <a href="#contact" className="text-gray-700 hover:text-[#2727E6] font-medium transition-colors">Contact</a>
            <button 
              onClick={handleLoginClick}
              className="gradient-button text-white px-6 py-2 rounded-xl font-semibold transform transition-all duration-300 hover:scale-105"
            >
              Login / Signup
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-[#2727E6] p-2"
            >
              {isMenuOpen ? (
                <Icon name="close-circle-bold" size={24} />
              ) : (
                <Icon name="hamburger-menu-bold" size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 px-6 border-t border-gray-200">
            <div className="space-y-4">
              <a href="#home" className="block text-gray-700 hover:text-[#2727E6] font-medium transition-colors py-2">Home</a>
              <a href="#about" className="block text-gray-700 hover:text-[#2727E6] font-medium transition-colors py-2">About</a>
              <a href="#features" className="block text-gray-700 hover:text-[#2727E6] font-medium transition-colors py-2">Features</a>
              <a href="#pricing" className="block text-gray-700 hover:text-[#2727E6] font-medium transition-colors py-2">Pricing</a>
              <a href="#contact" className="block text-gray-700 hover:text-[#2727E6] font-medium transition-colors py-2">Contact</a>
              <button 
                onClick={handleLoginClick}
                className="gradient-button text-white px-6 py-2 rounded-xl font-semibold w-full mt-2"
              >
                Login / Signup
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;