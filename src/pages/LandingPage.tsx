import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/navigation/LandingNavbar';
import Icon from '../components/common/Icon';
import { Button } from '../components/ui/button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation on mount
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-12 items-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Learn Anything with <span className="text-[#2727E6]">AI-Powered</span> Education
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Onliversity combines AI tutors, personalized learning paths, and interactive lessons to help you master any subject at your own pace.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGetStarted}
                variant="gradient" 
                size="xl"
                className="font-semibold"
              >
                Get Started for Free
              </Button>
              <Button 
                onClick={handleLoginClick}
                variant="outline" 
                size="xl"
                className="font-semibold"
              >
                Log In
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Icon name="check-circle-bold-duotone" size={20} className="text-green-600" />
              <span>No credit card required</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-20 right-20 w-40 h-40 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <div className="relative">
              <div className="bg-white p-4 rounded-2xl shadow-soft-lg">
                <img 
                  src="https://images.pexels.com/photos/5905700/pexels-photo-5905700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="AI-powered learning" 
                  className="rounded-xl w-full h-auto"
                />
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon name="brain-bold-duotone" size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">AI Tutor</p>
                    <p className="text-sm text-gray-600">Personalized learning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Revolutionary Learning Experience</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with proven educational methods to create a truly personalized learning journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Icon name="brain-bold-duotone" size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Personal Tutor</h3>
              <p className="text-gray-600">
                Interact with AI tutors that adapt to your learning style, answer questions, and provide personalized explanations.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Icon name="target-bold-duotone" size={28} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom Learning Paths</h3>
              <p className="text-gray-600">
                AI-generated learning paths tailored to your goals, current knowledge level, and preferred learning pace.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Icon name="medal-bold-duotone" size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Certifications</h3>
              <p className="text-gray-600">
                Earn verifiable certificates to showcase your skills and knowledge to employers and peers.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Icon name="chart-bar-bold-duotone" size={28} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Analytics</h3>
              <p className="text-gray-600">
                Track your learning journey with detailed analytics, identify strengths and areas for improvement.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Icon name="book-bookmark-bold-duotone" size={28} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert-Crafted Content</h3>
              <p className="text-gray-600">
                Access high-quality courses created by industry experts and enhanced with AI-powered learning tools.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Icon name="users-group-rounded-bold-duotone" size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Community Learning</h3>
              <p className="text-gray-600">
                Connect with fellow learners, share insights, and collaborate on projects to enhance your learning experience.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How Onliversity Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform makes learning efficient, engaging, and personalized in just a few simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2727E6] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Define Your Goals</h3>
              <p className="text-gray-600">
                Tell us what you want to learn, your current knowledge level, and your learning preferences.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2727E6] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Your Learning Path</h3>
              <p className="text-gray-600">
                Our AI creates a personalized learning path with courses, lessons, and resources tailored to you.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2727E6] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Learn with AI Support</h3>
              <p className="text-gray-600">
                Study at your own pace with AI tutors, interactive lessons, and real-time feedback on your progress.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Our Students Say</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from learners who have transformed their education with Onliversity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">JD</div>
                <div>
                  <p className="font-semibold text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">Software Developer</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The AI tutor helped me understand complex programming concepts that I had been struggling with for months. The personalized learning path was exactly what I needed."
              </p>
              <div className="flex text-yellow-500">
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">SM</div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Miller</p>
                  <p className="text-sm text-gray-600">Medical Student</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Studying for my medical exams became so much more efficient with Onliversity. The AI-generated flashcards and quizzes were incredibly helpful for retention."
              </p>
              <div className="flex text-yellow-500">
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-soft">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">RJ</div>
                <div>
                  <p className="font-semibold text-gray-900">Robert Johnson</p>
                  <p className="text-sm text-gray-600">Business Owner</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "As a busy entrepreneur, I needed flexible learning options. Onliversity's platform allowed me to learn at my own pace and apply new skills directly to my business."
              </p>
              <div className="flex text-yellow-500">
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-bold-duotone" size={20} />
                <Icon name="star-half-bold-duotone" size={20} />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your learning needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic</h3>
                <p className="text-gray-600">Perfect for casual learners</p>
              </div>
              
              <div className="mb-6">
                <p className="text-4xl font-bold text-gray-900">$0</p>
                <p className="text-gray-600">Free forever</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Access to free courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Basic AI tutor assistance</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Limited learning path creation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Community forum access</span>
                </li>
              </ul>
              
              <Button 
                onClick={handleGetStarted}
                variant="outline" 
                size="lg"
                className="w-full font-semibold"
              >
                Get Started
              </Button>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-white p-8 rounded-2xl shadow-soft-lg transition-all duration-300 border-2 border-[#2727E6] relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#2727E6] text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600">For dedicated learners</p>
              </div>
              
              <div className="mb-6">
                <p className="text-4xl font-bold text-gray-900">$19</p>
                <p className="text-gray-600">per month</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All Basic features</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited access to all courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Advanced AI tutor interactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited learning paths</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Certificate of completion</span>
                </li>
              </ul>
              
              <Button 
                onClick={handleGetStarted}
                variant="gradient" 
                size="lg"
                className="w-full font-semibold"
              >
                Start Pro Trial
              </Button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600">For teams and organizations</p>
              </div>
              
              <div className="mb-6">
                <p className="text-4xl font-bold text-gray-900">Custom</p>
                <p className="text-gray-600">Contact for pricing</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All Pro features</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom learning paths for teams</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Advanced analytics and reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => window.location.href = 'mailto:enterprise@onliversity.com'}
                variant="outline" 
                size="lg"
                className="w-full font-semibold"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2727E6] to-purple-600 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of learners who are already benefiting from our AI-powered education platform.
          </p>
          <Button 
            onClick={handleGetStarted}
            variant="outline" 
            size="xl"
            className="bg-white text-[#2727E6] hover:bg-blue-50 border-white font-semibold"
          >
            Start Learning Today
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#2727E6] rounded-lg flex items-center justify-center">
                  <Icon name="book-bold" size={22} className="text-white" />
                </div>
                <span className="text-xl font-bold">Onliversity</span>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing education with AI-powered personalized learning experiences.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Icon name="twitter-bold-duotone" size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Icon name="facebook-bold-duotone" size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Icon name="instagram-bold-duotone" size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Icon name="linkedin-bold-duotone" size={24} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Courses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Learning Paths</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">AI Tutors</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Certifications</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">For Educators</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Legal</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 Onliversity. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <select className="bg-gray-800 text-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;