import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CertificationService, type CertificationDetails } from '../../services/certificationService';
import ProgressBar from '../../components/analytics/ProgressBar';

const CertificationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificationDetails, setCertificationDetails] = useState<CertificationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<{[key: number]: boolean}>({});
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (id) {
      loadCertificationDetails(id);
    }
  }, [id]);

  const loadCertificationDetails = async (certificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const details = await CertificationService.getCertificationDetails(certificationId);
      setCertificationDetails(details);
      
      // Initialize all modules as expanded
      const initialExpandedState: {[key: number]: boolean} = {};
      details.modules.forEach(module => {
        initialExpandedState[module.id] = true;
      });
      setExpandedModules(initialExpandedState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certification details');
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleExpanded = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleEnroll = async () => {
    if (!certificationDetails) return;
    
    try {
      setIsEnrolling(true);
      await CertificationService.enrollInCertification(certificationDetails.certification.id);
      // Reload certification details to update enrollment status
      await loadCertificationDetails(id!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in certification');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleLessonClick = (lessonId: number) => {
    navigate(`/student/dashboard/certification-lesson/${lessonId}`);
  };

  const handleBackToCertifications = () => {
    navigate('/student/dashboard/certifications');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading certification details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificationDetails) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Certification</h2>
          <p className="text-gray-600 mb-4">{error || 'Certification not found'}</p>
          <button 
            onClick={handleBackToCertifications}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Certifications
          </button>
        </div>
      </div>
    );
  }

  const { certification, modules, enrollment } = certificationDetails;
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.completed_at !== null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={handleBackToCertifications}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <Icon name="arrow-left-bold-duotone" size={20} />
        Back to Certifications
      </button>

      {/* Certification Header */}
      <div className="card p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{certification.title}</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Certification
              </span>
            </div>
            <p className="text-gray-600 mb-4">Onliversity • {certification.category}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600 mb-2">Free</div>
            {isEnrolled && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 justify-end">
                <Icon name="check-circle-bold-duotone" size={14} />
                {isCompleted ? 'Completed' : 'Enrolled'}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">{certification.description}</p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Icon name="book-bookmark-bold-duotone" size={20} className="text-blue-600" />
            <span className="text-gray-700">{totalLessons} lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="clock-circle-bold-duotone" size={20} className="text-green-600" />
            <span className="text-gray-700">{certification.estimated_hours} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="target-bold-duotone" size={20} className="text-purple-600" />
            <span className="text-gray-700 capitalize">{certification.difficulty} level</span>
          </div>
        </div>

        {isEnrolled && enrollment && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-gray-900">{enrollment.progress}%</span>
            </div>
            <ProgressBar 
              value={enrollment.progress} 
              maxValue={100}
              color="#2727E6"
            />
            <p className="text-sm text-gray-500 mt-2">
              {isCompleted 
                ? `Completed on ${new Date(enrollment.completed_at!).toLocaleDateString()}`
                : `Enrolled on ${new Date(enrollment.enrolled_at).toLocaleDateString()}`
              }
            </p>
          </div>
        )}
        
        {isEnrolled ? (
          <button 
            onClick={() => {
              // Find the first incomplete lesson
              for (const module of modules) {
                for (const lesson of module.lessons) {
                  if (!lesson.progress?.completed) {
                    handleLessonClick(lesson.id);
                    return;
                  }
                }
              }
              // If all lessons are complete, go to the first lesson
              if (modules.length > 0 && modules[0].lessons.length > 0) {
                handleLessonClick(modules[0].lessons[0].id);
              }
            }}
            className="gradient-button text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <Icon name="play-circle-bold-duotone" size={20} />
            {isCompleted ? 'Review Certification' : 'Continue Learning'}
          </button>
        ) : (
          <button 
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="gradient-button text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {isEnrolling ? (
              <>
                <Icon name="spinner-bold-duotone" size={20} className="animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <Icon name="add-square-bold-duotone" size={20} />
                Enroll Now
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Certification Content</h2>
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="card p-0 overflow-hidden">
                {/* Module Header */}
                <div 
                  className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
                  onClick={() => toggleModuleExpanded(module.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#2727E6] rounded-full flex items-center justify-center text-white font-semibold">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                      </div>
                    </div>
                    <Icon 
                      name={expandedModules[module.id] ? "alt-arrow-up-bold-duotone" : "alt-arrow-down-bold-duotone"} 
                      size={20} 
                      className="text-gray-500"
                    />
                  </div>
                </div>
                
                {/* Module Lessons */}
                {expandedModules[module.id] && (
                  <div className="divide-y divide-gray-100">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div 
                        key={lesson.id} 
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          lesson.progress?.completed 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-blue-50'
                        }`}
                        onClick={() => isEnrolled && handleLessonClick(lesson.id)}
                      >
                        <div className="flex items-center gap-4 pl-11">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            lesson.progress?.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {lesson.progress?.completed ? (
                              <Icon name="check-circle-bold-duotone" size={16} />
                            ) : (
                              <span className="text-xs font-semibold">{moduleIndex + 1}.{lessonIndex + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Icon name="clock-circle-bold-duotone" size={14} />
                                {lesson.duration}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                video
                              </span>
                            </div>
                          </div>
                          
                          {isEnrolled ? (
                            <Icon name="play-circle-bold-duotone" size={18} className="text-gray-400" />
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certification Sidebar */}
        <div className="space-y-6">
          {/* Skills You'll Gain */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills You'll Gain</h3>
            <div className="flex flex-wrap gap-2">
              {certification.skills?.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certification Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Modules</span>
                <span className="font-medium">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lessons</span>
                <span className="font-medium">{totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium">{certification.estimated_hours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Level</span>
                <span className="font-medium capitalize">{certification.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium capitalize">{certification.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Language</span>
                <span className="font-medium">English</span>
              </div>
            </div>
          </div>

          {/* Certification Requirements */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification Requirements</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Complete all lessons in the certification</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Pass all quizzes with a minimum score of 70%</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Complete the final assessment</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Achieve an overall score of 70% or higher</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationDetails;