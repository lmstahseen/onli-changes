import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon';
import LandingNavbar from '../components/navigation/LandingNavbar';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStudentLogin = () => {
    navigate('/login?role=student');
  };

  const handleTeacherLogin = () => {
    navigate('/login?role=teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Onliversity: Your Personal
            <span className="text-[#2727E6] block mt-2">AI Learning Companion</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Revolutionary e-learning through personalized AI-powered tutoring with interactive video avatars
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={handleStudentLogin}
              className="gradient-button text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-3 min-w-[240px] justify-center"
            >
              <Icon name="book-bold" size={24} />
              Start Learning
            </button>
            <button 
              onClick={handleTeacherLogin}
              className="gradient-button text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-3 min-w-[240px] justify-center"
            >
              <Icon name="users-group-rounded-bold" size={24} />
              Become a Partner
            </button>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <div className="px-6 py-16 lg:px-8" id="how-it-works">
        <div className="mx-auto">
          <div className="max-w-2xl text-center mx-auto">
            <p className="text-base font-semibold leading-7 text-[#2727E6]">
              What is Onliversity?
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Learn with <span className="text-[#2727E6]">AI-powered</span> tutoring <br />
              <span className="">in 3 simple steps</span>
            </h2>
            <p className="mt-6 sm:text-lg font-medium leading-7 text-slate-600">
              Tell us what you want to learn, and Onliversity will create <b>personalized interactive lessons</b> tailored to your needs. 
              No more generic courses. <b>You focus on learning.</b>
            </p>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            <div className="w-full sm:w-auto relative transition-transform ease-out hover:scale-[1.015]">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-[#2727E6] border-2 border-[#2727E6] text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full sm:w-[310px] h-[355px] flex flex-col">
                  <img src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Step 1" className="w-full h-44 object-cover" />
                  <div className="py-5 px-6 relative h-full">
                    <div className="absolute inset-0 z-0 h-full w-full bg-white opacity-[0.15] [background:radial-gradient(125%_125%_at_50%_10%,#fff_55%,#2727E6_100%)]"></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Choose your learning goal
                    </h3>
                    <p className="text-sm text-gray-700 font-medium">
                      Tell us what you want to learn, your current knowledge level, and any specific goals you have.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-auto relative transition-transform ease-out hover:scale-[1.015]">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-[#2727E6] border-2 border-[#2727E6] text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full sm:w-[310px] h-[355px] flex flex-col">
                  <img src="https://images.pexels.com/photos/5905700/pexels-photo-5905700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Step 2" className="w-full h-44 object-cover" />
                  <div className="py-5 px-6 relative h-full">
                    <div className="absolute inset-0 z-0 h-full w-full bg-white opacity-[0.15] [background:radial-gradient(125%_125%_at_50%_10%,#fff_55%,#2727E6_100%)]"></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      AI creates personalized content
                    </h3>
                    <p className="text-sm text-gray-700 font-medium">
                      Our AI generates custom lessons, quizzes, and flashcards tailored specifically to your learning needs and style.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-auto relative transition-transform ease-out hover:scale-[1.015]">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-[#2727E6] border-2 border-[#2727E6] text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full sm:w-[310px] h-[355px] flex flex-col">
                  <img src="https://images.pexels.com/photos/5905885/pexels-photo-5905885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Step 3" className="w-full h-44 object-cover" />
                  <div className="py-5 px-6 relative h-full">
                    <div className="absolute inset-0 z-0 h-full w-full bg-white opacity-[0.15] [background:radial-gradient(125%_125%_at_50%_10%,#fff_55%,#2727E6_100%)]"></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Learn with AI video tutors
                    </h3>
                    <p className="text-sm text-gray-700 font-medium">
                      Engage with interactive AI video tutors that explain concepts, answer questions, and adapt to your learning pace in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Opportunity Section */}
      <section className="relative overflow-hidden py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="px-3 mb-4 font-medium py-1 border border-[#2727E6]/20 bg-[#2727E6]/5 rounded-full inline-flex text-sm text-[#2727E6] shadow-sm justify-center items-center">
              Why Traditional E-Learning Falls Short
            </h2>
            <h3 className="mb-2 text-xl font-bold sm:mb-4 sm:text-[2.8rem] leading-[1.1] text-gray-900">
              The Learning Problem
              <br />
              <span className="text-[#2727E6]">Onliversity is the better way.</span>
            </h3>
            <p className="sm:text-lg text-gray-600 max-w-3xl mx-auto mt-2 sm:mt-0">
              Stop wasting hours with one-size-fits-all courses and start experiencing personalized, interactive learning that actually works. Onliversity is your <span className="text-[#2727E6]">AI Learning Companion</span>.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16 -mt-8 sm:mt-0">
            {/* Traditional E-Learning */}
            <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
              <div className="bg-red-50/[0.05] rounded-2xl shadow-lg overflow-hidden h-full border border-red-500/10">
                <div className="p-8 relative">
                  <div className="flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-medium text-gray-900 mt-0.5 opacity-50">Current E-Learning Limitations</span>
                  </div>
                  <div className="space-y-3 mb-8 mt-5">
                    <div className="flex items-start space-x-3">
                      <Icon name="close-circle-bold-duotone" size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Lack of personalized interaction and feedback</span>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Icon name="close-circle-bold-duotone" size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">High dropout rates due to lack of engagement</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Icon name="close-circle-bold-duotone" size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Limited accessibility to quality education</span>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Icon name="close-circle-bold-duotone" size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Difficulty maintaining student motivation</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Icon name="close-circle-bold-duotone" size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Standardized content that doesn't adapt to needs</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* With Onliversity */}
            <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
              <div className="bg-[#fcfffd] rounded-2xl shadow-lg overflow-hidden h-full border border-green-500/30">
                <div className="p-8 relative">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-900 mt-0.5">With</span>
                    <span className="font-semibold text-3xl text-gray-800 flex justify-center items-center ml-2">
                      <div>Onli<span className="text-[#2727E6]">versity</span></div>
                      <Icon name="book-bold-duotone" size={24} className="text-[#2727E6] ml-1" />
                    </span>
                  </div>
                  <div className="space-y-4 mb-8 mt-5">
                    <div className="flex items-start gap-4">
                      <Icon name="check-circle-bold-duotone" size={24} className="text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Interactive AI avatars with real-time feedback</h5>
                        <p className="text-sm text-gray-600">Engage with AI tutors that provide personalized guidance and adapt to your learning pace.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Icon name="check-circle-bold-duotone" size={24} className="text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Adaptive learning paths that evolve with you</h5>
                        <p className="text-sm text-gray-600">Content automatically adjusts to your strengths and weaknesses, ensuring optimal learning progression.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Icon name="check-circle-bold-duotone" size={24} className="text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Conversational learning that feels natural</h5>
                        <p className="text-sm text-gray-600">Learn through natural conversations that make complex topics accessible and engaging.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-xs sm:text-base">
                    <div className="flex items-center space-x-2 text-green-600">
                      <Icon name="check-circle-bold-duotone" size={20} />
                      <span className="font-semibold">Effective learning in just 20 min/day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative overflow-hidden px-3 sm:px-0 py-20">
        <div className="py-12 md:py-10">
          <div className="max-w-xl px-4 mx-auto lg:max-w-6xl sm:px-6">
            <div className="space-y-12 lg:flex lg:space-y-0 lg:space-x-12 xl:space-x-18">
              <div className="lg:max-w-none lg:min-w-[524px]">
                <h2 className="px-3 mb-4 font-medium py-1 border border-[#2727E6]/20 bg-[#2727E6]/5 rounded-full inline-flex text-sm text-[#2727E6] shadow-sm justify-center items-center">
                  <Icon name="brain-bold-duotone" className="mr-1.5 size-3.5 text-[#2727E6]" size={14} />
                  Our Features
                </h2>
                <div className="mb-8">
                  <h3 className="mb-2 text-3xl font-bold sm:mb-4 sm:text-[2.8rem] leading-[1.1] text-gray-900">
                    AI-powered learning never felt so <span className="text-[#2727E6]">easy</span> and <span className="text-[#2727E6]">powerful</span>
                  </h3>
                  <p className="sm:text-lg text-gray-600">
                    Find personalized learning paths, engage with AI tutors, and turn your educational goals into reality with the only learning platform you'll ever need.
                  </p>
                </div>
                <div className="relative block mb-10 sm:hidden lg:max-w-none">
                  <div className="relative flex flex-col">
                    <div className="w-full" id="feature-1-mobile">
                      <div>
                        <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                          <div className="border-2 border-gray-300 border-double rounded-lg">
                            <img src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="AI Tutor" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full hidden" id="feature-2-mobile">
                      <div>
                        <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                          <div className="border-2 border-gray-300 border-double rounded-lg">
                            <img src="https://images.pexels.com/photos/5905700/pexels-photo-5905700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Personalized Learning" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full hidden" id="feature-3-mobile">
                      <div>
                        <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                          <div className="border-2 border-gray-300 border-double rounded-lg">
                            <img src="https://images.pexels.com/photos/5905885/pexels-photo-5905885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Interactive Learning" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full hidden" id="feature-4-mobile">
                      <div>
                        <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                          <div className="border-2 border-gray-300 border-double rounded-lg">
                            <img src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Collaborative Learning" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full hidden" id="feature-5-mobile">
                      <div>
                        <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                          <div className="border-2 border-gray-300 border-double rounded-lg">
                            <img src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Progress Tracking" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full hidden" id="feature-6-mobile">
                      <div>
                        <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                          <div className="border-2 border-gray-300 border-double rounded-lg">
                            <img src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Certification" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid mb-8 space-y-0 sm:grid-cols-2 md:mb-0 gap-x-3 gap-y-1">
                  <button 
                    className="[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box] flex items-start px-5 py-4 text-left border border-transparent rounded-2xl brand-btn-animation"
                    id="feature-btn-1"
                    onClick={() => {
                      document.querySelectorAll('[id^="feature-"]').forEach(el => el.classList.add('hidden'));
                      document.querySelectorAll('[id^="feature-btn-"]').forEach(el => {
                        el.classList.remove('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                        el.classList.remove('text-zinc-100');
                        el.classList.add('text-zinc-600');
                      });
                      document.getElementById('feature-1')?.classList.remove('hidden');
                      document.getElementById('feature-1-mobile')?.classList.remove('hidden');
                      document.getElementById('feature-btn-1')?.classList.add('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                      document.getElementById('feature-btn-1')?.classList.remove('text-zinc-600');
                      document.getElementById('feature-btn-1')?.classList.add('text-zinc-100');
                    }}
                  >
                    <span className="mr-3 shrink-0 fill-zinc-400">🎓</span>
                    <div>
                      <div className="text-zinc-100 mb-1 text-base font-semibold">AI Video Tutors</div>
                      <div className="text-zinc-300 font-medium text-xs">Engage with lifelike AI tutors that explain concepts, answer questions, and adapt to your learning pace.</div>
                    </div>
                  </button>
                  
                  <button 
                    className="flex items-start px-5 py-4 text-left border border-transparent rounded-2xl brand-btn-animation"
                    id="feature-btn-2"
                    onClick={() => {
                      document.querySelectorAll('[id^="feature-"]').forEach(el => el.classList.add('hidden'));
                      document.querySelectorAll('[id^="feature-btn-"]').forEach(el => {
                        el.classList.remove('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                        el.classList.remove('text-zinc-100');
                        el.classList.add('text-zinc-600');
                      });
                      document.getElementById('feature-2')?.classList.remove('hidden');
                      document.getElementById('feature-2-mobile')?.classList.remove('hidden');
                      document.getElementById('feature-btn-2')?.classList.add('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                      document.getElementById('feature-btn-2')?.classList.remove('text-zinc-600');
                      document.getElementById('feature-btn-2')?.classList.add('text-zinc-100');
                    }}
                  >
                    <span className="mr-3 shrink-0 fill-zinc-400">🎯</span>
                    <div>
                      <div className="text-zinc-600 mb-1 text-base font-semibold">Personalized Learning Paths</div>
                      <div className="text-zinc-500 line-clamp-2 text-xs">Get customized learning paths tailored to your goals, current knowledge level, and preferred learning style.</div>
                    </div>
                  </button>
                  
                  <button 
                    className="flex items-start px-5 py-4 text-left border border-transparent rounded-2xl brand-btn-animation"
                    id="feature-btn-3"
                    onClick={() => {
                      document.querySelectorAll('[id^="feature-"]').forEach(el => el.classList.add('hidden'));
                      document.querySelectorAll('[id^="feature-btn-"]').forEach(el => {
                        el.classList.remove('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                        el.classList.remove('text-zinc-100');
                        el.classList.add('text-zinc-600');
                      });
                      document.getElementById('feature-3')?.classList.remove('hidden');
                      document.getElementById('feature-3-mobile')?.classList.remove('hidden');
                      document.getElementById('feature-btn-3')?.classList.add('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                      document.getElementById('feature-btn-3')?.classList.remove('text-zinc-600');
                      document.getElementById('feature-btn-3')?.classList.add('text-zinc-100');
                    }}
                  >
                    <span className="mr-3 shrink-0 fill-zinc-400">🧠</span>
                    <div>
                      <div className="text-zinc-600 mb-1 text-base font-semibold">Interactive Quizzes</div>
                      <div className="text-zinc-500 line-clamp-2 text-xs">Test your knowledge with AI-generated quizzes that adapt to your progress and help reinforce key concepts.</div>
                    </div>
                  </button>
                  
                  <button 
                    className="flex items-start px-5 py-4 text-left border border-transparent rounded-2xl brand-btn-animation"
                    id="feature-btn-4"
                    onClick={() => {
                      document.querySelectorAll('[id^="feature-"]').forEach(el => el.classList.add('hidden'));
                      document.querySelectorAll('[id^="feature-btn-"]').forEach(el => {
                        el.classList.remove('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                        el.classList.remove('text-zinc-100');
                        el.classList.add('text-zinc-600');
                      });
                      document.getElementById('feature-4')?.classList.remove('hidden');
                      document.getElementById('feature-4-mobile')?.classList.remove('hidden');
                      document.getElementById('feature-btn-4')?.classList.add('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                      document.getElementById('feature-btn-4')?.classList.remove('text-zinc-600');
                      document.getElementById('feature-btn-4')?.classList.add('text-zinc-100');
                    }}
                  >
                    <span className="mr-3 shrink-0 fill-zinc-400">👥</span>
                    <div>
                      <div className="text-zinc-600 mb-1 text-base font-semibold">Collaborative Learning</div>
                      <div className="text-zinc-500 line-clamp-2 text-xs">Connect with other learners, share insights, and participate in group discussions to enhance your understanding.</div>
                    </div>
                  </button>
                  
                  <button 
                    className="flex items-start px-5 py-4 text-left border border-transparent rounded-2xl brand-btn-animation"
                    id="feature-btn-5"
                    onClick={() => {
                      document.querySelectorAll('[id^="feature-"]').forEach(el => el.classList.add('hidden'));
                      document.querySelectorAll('[id^="feature-btn-"]').forEach(el => {
                        el.classList.remove('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                        el.classList.remove('text-zinc-100');
                        el.classList.add('text-zinc-600');
                      });
                      document.getElementById('feature-5')?.classList.remove('hidden');
                      document.getElementById('feature-5-mobile')?.classList.remove('hidden');
                      document.getElementById('feature-btn-5')?.classList.add('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                      document.getElementById('feature-btn-5')?.classList.remove('text-zinc-600');
                      document.getElementById('feature-btn-5')?.classList.add('text-zinc-100');
                    }}
                  >
                    <span className="mr-3 shrink-0 fill-zinc-400">📊</span>
                    <div>
                      <div className="text-zinc-600 mb-1 text-base font-semibold">Progress Tracking</div>
                      <div className="text-zinc-500 line-clamp-2 text-xs">Monitor your learning journey with detailed analytics and insights to help you stay motivated and on track.</div>
                    </div>
                  </button>
                  
                  <button 
                    className="flex items-start px-5 py-4 text-left border border-transparent rounded-2xl brand-btn-animation"
                    id="feature-btn-6"
                    onClick={() => {
                      document.querySelectorAll('[id^="feature-"]').forEach(el => el.classList.add('hidden'));
                      document.querySelectorAll('[id^="feature-btn-"]').forEach(el => {
                        el.classList.remove('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                        el.classList.remove('text-zinc-100');
                        el.classList.add('text-zinc-600');
                      });
                      document.getElementById('feature-6')?.classList.remove('hidden');
                      document.getElementById('feature-6-mobile')?.classList.remove('hidden');
                      document.getElementById('feature-btn-6')?.classList.add('[background:linear-gradient(#2E2E32,#2E2E32)_padding-box,linear-gradient(120deg,theme(colors.zinc.600),theme(colors.zinc.700/0),theme(colors.zinc.600))_border-box]');
                      document.getElementById('feature-btn-6')?.classList.remove('text-zinc-600');
                      document.getElementById('feature-btn-6')?.classList.add('text-zinc-100');
                    }}
                  >
                    <span className="mr-3 shrink-0 fill-zinc-400">🏆</span>
                    <div>
                      <div className="text-zinc-600 mb-1 text-base font-semibold">Certifications</div>
                      <div className="text-zinc-500 line-clamp-2 text-xs">Earn verifiable certificates to showcase your skills and achievements to employers and your network.</div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="relative hidden sm:block lg:max-w-none">
                <div className="relative flex flex-col sm:mt-24 sm:ml-4">
                  <div className="w-full" id="feature-1">
                    <div>
                      <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                        <div className="border-2 border-gray-300 border-double rounded-lg">
                          <img src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="AI Tutor" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full hidden" id="feature-2">
                    <div>
                      <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                        <div className="border-2 border-gray-300 border-double rounded-lg">
                          <img src="https://images.pexels.com/photos/5905700/pexels-photo-5905700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Personalized Learning" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full hidden" id="feature-3">
                    <div>
                      <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                        <div className="border-2 border-gray-300 border-double rounded-lg">
                          <img src="https://images.pexels.com/photos/5905885/pexels-photo-5905885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Interactive Learning" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full hidden" id="feature-4">
                    <div>
                      <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                        <div className="border-2 border-gray-300 border-double rounded-lg">
                          <img src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Collaborative Learning" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full hidden" id="feature-5">
                    <div>
                      <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                        <div className="border-2 border-gray-300 border-double rounded-lg">
                          <img src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Progress Tracking" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full hidden" id="feature-6">
                    <div>
                      <div className="border shadow-lg bg-gray-50 rounded-3xl p-3">
                        <div className="border-2 border-gray-300 border-double rounded-lg">
                          <img src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="mx-auto rounded-lg shadow-2xl lg:max-w-2xl" alt="Certification" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Innovation Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Powered by Cutting-Edge Technology</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8">
              <h3 className="text-xl font-semibold mb-4">DeepSeek AI</h3>
              <p className="text-gray-600">Advanced language understanding for natural conversations and content generation</p>
            </div>
            <div className="card p-8">
              <h3 className="text-xl font-semibold mb-4">Tavus CVI</h3>
              <p className="text-gray-600">Lifelike video avatars that create engaging, personalized learning experiences</p>
            </div>
            <div className="card p-8">
              <h3 className="text-xl font-semibold mb-4">Adaptive Learning</h3>
              <p className="text-gray-600">Machine learning algorithms that personalize content and pacing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Who Benefits from Onliversity?</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="card p-8">
              <Icon name="book-bold" size={48} className="text-[#2727E6] mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Students & Lifelong Learners</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• High school and college students</li>
                <li>• Working professionals seeking new skills</li>
                <li>• Self-directed learners of all ages</li>
                <li>• Those preparing for certifications</li>
              </ul>
            </div>
            <div className="card p-8">
              <Icon name="users-group-rounded-bold" size={48} className="text-[#2727E6] mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Educators & Instructors</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Subject matter experts</li>
                <li>• Professional trainers</li>
                <li>• Academic institutions</li>
                <li>• Corporate training departments</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Onliversity Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Why Choose Onliversity?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Icon name="star-bold" size={48} className="text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Personalized</h3>
              <p className="text-gray-600 text-sm">Every lesson adapts to your learning style</p>
            </div>
            <div className="text-center">
              <Icon name="target-bold" size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Effective</h3>
              <p className="text-gray-600 text-sm">Proven methods for better retention</p>
            </div>
            <div className="text-center">
              <Icon name="users-group-rounded-bold" size={48} className="text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Accessible</h3>
              <p className="text-gray-600 text-sm">Available 24/7 from anywhere</p>
            </div>
            <div className="text-center">
              <Icon name="dollar-bold" size={48} className="text-[#2727E6] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Affordable</h3>
              <p className="text-gray-600 text-sm">Quality education at a fraction of the cost</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="md:scale-[0.85] -mt-4 sm:-mt-5" id="pricing">
        <div className="relative items-center w-full px-1 py-6 mx-auto md:py-0 md:px-12 lg:px-16 max-w-8xl">
          <div className="">
            <div className="mx-auto text-center">
              <div className="flex flex-col p-8 lg:p-0">
                <h2 className="px-4 mb-4 mx-auto font-medium py-1 border border-blue-100 bg-blue-50/50 rounded-full inline-flex text-base text-[#2727E6] shadow-sm justify-center items-center">
                  Pricing
                </h2>
                <h3 className="mt-2 text-3xl md:text-6xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Pricing that <br className="block sm:hidden" /><span className="text-[#2727E6]">pays for itself</span>
                </h3>
                <p className="mt-6 max-w-2xl text-left sm:text-center mx-auto md:text-xl leading-8 text-gray-600">
                  Traditional education can cost you <b>thousands of dollars</b>. Onliversity delivers personalized AI learning for a fraction of the cost. It literally pays for itself if you gain <span className="border-b-2 pb-0.5 border-[#2727E6] font-semibold">just one new skill</span>.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center mb-8 px-4 lg:px-0 mt-6 lg:mt-16">
              <div className="w-full flex justify-center relative overflow-x-hidden py-1">
                <button aria-label="pricing toggle" className="flex-shrink-0 ring-1 ring-[#2727E6]/30 flex items-center relative h-10 flex-shrink-0 cursor-pointer rounded-full p-1 w-full focus:outline-none max-w-xs mb-12" role="switch" type="button" tabIndex={0} aria-checked="false">
                  <span aria-hidden="true" className="flex-shrink-0 absolute inset-y-0 w-1/2 flex items-center justify-center pointer-events-none z-[1] transition-colors duration-200 select-none text-sm font-semibold flex-shrink-0 left-0 text-white">Monthly</span>
                  <span aria-hidden="true" className="flex-shrink-0 absolute inset-y-0 w-1/2 flex items-center justify-center pointer-events-none z-[1] transition-colors duration-200 select-none text-sm font-semibold flex-shrink-0 right-0 text-[#2727E6]">Yearly</span>
                  <span aria-hidden="true" className="translate-x-0 w-1/2 text-white pointer-events-none inline-block h-8 transform rounded-full bg-[#2727E6] shadow transition duration-200 ease-in-out z-0 relative"></span>
                </button>
                <div className="absolute mx-auto top-2.5 ml-[550px]">
                  <div className="text-[#2727E6] text-sm font-medium px-3 py-1 rounded-full flex items-center">
                    → Save 20% With <span className="font-semibold ml-1">Yearly Billing</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-col flex lg:flex-row justify-center items-center lg:items-end lg:space-x-6 relative">
                {/* Professional Plan */}
                <section className="flex justify-center mb-4 lg:mb-0">
                  <div className="border shadow-lg bg-gray-50 rounded-3xl p-3 z-10 scale-95">
                    <div className="flex relative w-[370px] flex-col px-6 py-8 mx-auto bg-white rounded-2xl">
                      <h3 className="mt-2 text-2xl text-gray-900 font-medium">Professional</h3>
                      <div className="flex mt-3 items-center justify-start">
                        <div className="text-4xl font-light tracking-tight">
                          <span className="font-medium">$79</span>
                          <span className="text-xl ml-0.5">/ month</span>
                        </div>
                      </div>
                      <p className="mt-4 text-base text-gray-600">
                        Maximize learning potential across multiple subjects with our most powerful AI tutoring platform.
                      </p>
                      <ul role="list" className="flex flex-col mt-7 text-sm text-gray-600 gap-y-3">
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Unlimited AI Tutor Sessions</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Unlimited Learning Paths</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">All Certifications Included</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Advanced Analytics Dashboard</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Document Analysis & Learning</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Unlimited AI-Generated Quizzes</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Priority Support</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Team Learning Features</span>
                        </li>
                      </ul>
                      <button 
                        onClick={handleStudentLogin}
                        className="inline-flex items-center text-lg justify-center w-full h-full px-3 py-2.5 font-medium text-white rounded-full cursor-pointer bg-[#2727E6] hover:bg-[#1d1db8] backdrop-blur-3xl mt-8"
                      >
                        Start Learning Now
                        <Icon name="arrow-right-bold-duotone" size={20} className="ml-2" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Growth Plan */}
                <section className="flex justify-center mb-4 lg:mb-0">
                  <div className="border shadow-lg bg-gray-50 rounded-3xl p-3 z-10 border-[#2727E6]/20" style={{ boxShadow: "rgba(39, 39, 230, 0.106) 0px 0px 30px, rgba(39, 39, 230, 0.1) 0px 0px 60px" }}>
                    <div className="flex relative w-[370px] flex-col px-6 py-8 mx-auto bg-white rounded-2xl border-2 border-[#2727E6]/60 bg-blue-50/50">
                      <div className="top-[-1px] text-sm absolute w-auto px-3 py-2 font-medium text-white font-medium right-[-1px] bg-[#2727E6]/95 rounded-bl-xl rounded-tr-2xl">
                        Recommended
                      </div>
                      <h3 className="mt-2 text-2xl text-gray-900 font-medium">Growth</h3>
                      <div className="flex mt-3 items-center justify-start">
                        <div className="text-4xl font-light tracking-tight">
                          <span className="font-medium">$39</span>
                          <span className="text-xl ml-0.5">/ month</span>
                        </div>
                      </div>
                      <p className="mt-4 text-base text-gray-600">
                        Accelerate your learning with personalized AI tutoring and comprehensive learning paths.
                      </p>
                      <ul role="list" className="flex flex-col mt-7 text-sm text-gray-600 gap-y-3">
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">100 AI Tutor Sessions/month</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">5 Active Learning Paths</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">All Certifications Included</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Standard Analytics Dashboard</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Basic Document Analysis</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">200 AI-Generated Quizzes/month</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Email Support</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Individual Learning</span>
                        </li>
                      </ul>
                      <button 
                        onClick={handleStudentLogin}
                        className="inline-flex items-center text-lg justify-center w-full h-full px-3 py-2.5 font-medium text-white rounded-full cursor-pointer bg-[#2727E6] hover:bg-[#1d1db8] backdrop-blur-3xl mt-8"
                      >
                        Start Learning Now
                        <Icon name="arrow-right-bold-duotone" size={20} className="ml-2" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Startup Plan */}
                <section className="flex justify-center mb-4 lg:mb-0">
                  <div className="border shadow-lg bg-gray-50 rounded-3xl p-3 z-10 scale-95">
                    <div className="flex relative w-[370px] flex-col px-6 py-8 mx-auto bg-white rounded-2xl">
                      <h3 className="mt-2 text-2xl text-gray-900 font-medium">Startup</h3>
                      <div className="flex mt-3 items-center justify-start">
                        <div className="text-4xl font-light tracking-tight">
                          <span className="font-medium">$19</span>
                          <span className="text-xl ml-0.5">/ month</span>
                        </div>
                      </div>
                      <p className="mt-4 text-base text-gray-600">
                        Start your AI-powered learning journey with our entry-level plan for students new to personalized education.
                      </p>
                      <ul role="list" className="flex flex-col mt-7 text-sm text-gray-600 gap-y-3">
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">50 AI Tutor Sessions/month</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">2 Active Learning Paths</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Basic Certifications</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Basic Analytics</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Limited Document Analysis</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">100 AI-Generated Quizzes/month</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Email Support</span>
                        </li>
                        <li className="flex items-center">
                          <span className="flex-shrink-0 w-5 h-5 text-green-500">
                            <Icon name="check-circle-bold-duotone" size={20} />
                          </span>
                          <span className="ml-3 text-base font-medium">Individual Learning</span>
                        </li>
                      </ul>
                      <button 
                        onClick={handleStudentLogin}
                        className="inline-flex items-center text-lg justify-center w-full h-full px-3 py-2.5 font-medium text-white rounded-full cursor-pointer bg-[#2727E6] hover:bg-[#1d1db8] backdrop-blur-3xl mt-8"
                      >
                        Start Learning Now
                        <Icon name="arrow-right-bold-duotone" size={20} className="ml-2" />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#2727E6] to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of learners who are already experiencing the future of education</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={handleStudentLogin}
              className="bg-white text-[#2727E6] px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-3 hover:bg-gray-100 transition-colors"
            >
              Start Learning Today <Icon name="arrow-right-bold" size={20} />
            </button>
            <button 
              onClick={handleTeacherLogin}
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-[#2727E6] transition-colors"
            >
              Become an Instructor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Onliversity</h3>
          <p className="text-gray-400 mb-8">Revolutionizing education through AI-powered personalized learning</p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-400">
            © 2024 Onliversity. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
