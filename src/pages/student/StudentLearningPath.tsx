import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { PersonalLearningPathService, type PersonalLearningPath } from '../../services/personalLearningPathService';

const StudentLearningPath: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'paths'>('paths');
  const [personalPaths, setPersonalPaths] = useState<(PersonalLearningPath & { progress: number, total_lessons: number, completed_lessons: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFeatureGuide, setShowFeatureGuide] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    goalTopic: '',
    currentStanding: '',
    examDate: '',
    file: null as File | null,
    fileContent: ''
  });

  useEffect(() => {
    loadPersonalLearningPaths();
    
    // Check if feature guide has been dismissed before
    const featureGuideDismissed = localStorage.getItem('learningPathGuideDismissed');
    if (featureGuideDismissed === 'true') {
      setShowFeatureGuide(false);
    }
  }, []);

  const loadPersonalLearningPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      const paths = await PersonalLearningPathService.getPersonalLearningPaths();
      setPersonalPaths(paths);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFormData(prev => ({
        ...prev,
        file: selectedFile
      }));
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          fileContent: content
        }));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleGeneratePath = async () => {
    if (!formData.goalTopic.trim() || !formData.currentStanding.trim()) {
      setGenerationError('Please provide both your learning goal and current knowledge level');
      return;
    }
    
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      const response = await PersonalLearningPathService.generatePersonalLearningPath({
        goal_topic: formData.goalTopic,
        current_standing: formData.currentStanding,
        exam_date: formData.examDate || undefined,
        document_content: formData.fileContent || undefined
      });
      
      // Reset form
      setFormData({
        goalTopic: '',
        currentStanding: '',
        examDate: '',
        file: null,
        fileContent: ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reload paths and switch to paths tab
      await loadPersonalLearningPaths();
      setActiveTab('paths');
      
      // Navigate to the newly created path
      navigate(`/student/dashboard/learning-path/personal/${response.path_id}`);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate learning path');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPath = (pathId: number) => {
    navigate(`/student/dashboard/learning-path/personal/${pathId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dismissFeatureGuide = () => {
    setShowFeatureGuide(false);
    localStorage.setItem('learningPathGuideDismissed', 'true');
  };

  const dismissFeatureGuideWithConfirmation = () => {
    if (window.confirm("Are you sure you want to hide this guide? It won't appear again.")) {
      dismissFeatureGuide();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Personalized Learning Paths</h1>
        <p className="text-gray-600">Create AI-generated learning paths tailored to your goals and schedule</p>
      </div>

      {/* Feature Guide */}
      {showFeatureGuide && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="target-bold-duotone" size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How Learning Paths Work</h3>
                <p className="text-gray-700 mb-4">
                  Learning Paths are AI-generated, personalized study plans designed to help you achieve specific learning goals.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Creating a Learning Path:</p>
                    <ol className="space-y-1 text-gray-700 list-decimal list-inside">
                      <li>Define your specific learning goal</li>
                      <li>Describe your current knowledge level</li>
                      <li>Optionally set an exam date or upload materials</li>
                      <li>Let AI generate a customized learning plan</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Key Benefits:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Structured modules and lessons tailored to you</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Daily study schedule to keep you on track</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Interactive quizzes and flashcards for each lesson</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={dismissFeatureGuideWithConfirmation}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Don't show this again
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowFeatureGuide(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon name="close-circle-bold-duotone" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('paths')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'paths'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Learning Paths
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create New Path
          </button>
        </div>
      </div>

      {/* Create New Path Form */}
      {activeTab === 'create' && (
        <div className="card p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="target-bold-duotone" size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Your Personalized Learning Path</h2>
            <p className="text-gray-600">Our AI will generate a customized learning path based on your goals and current knowledge</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <label htmlFor="goalTopic" className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to learn or prepare for? *
              </label>
              <input
                type="text"
                id="goalTopic"
                name="goalTopic"
                value={formData.goalTopic}
                onChange={handleInputChange}
                placeholder="e.g., 'Math IGCSE Exam', 'Web Development', 'Spanish Fluency'"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Be specific about your learning goal or exam you're preparing for
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="currentStanding" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your current knowledge level: *
              </label>
              <textarea
                id="currentStanding"
                name="currentStanding"
                value={formData.currentStanding}
                onChange={handleInputChange}
                placeholder="e.g., 'Grade 8 math level', 'Know basic HTML and CSS', 'Complete beginner in Spanish'"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Include your current grade level, specific topics you already know, or your experience level
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="examDate" className="block text-sm font-medium text-gray-700 mb-2">
                Target Exam Date (Optional):
              </label>
              <input
                type="date"
                id="examDate"
                name="examDate"
                value={formData.examDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                If you're preparing for an exam, provide the date to create a study schedule
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="document"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.md,.doc,.docx,.pdf"
                  className="hidden"
                />
                <label
                  htmlFor="document"
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="upload-bold-duotone" size={20} className="text-gray-500" />
                  <span className="text-gray-600">
                    {formData.file ? formData.file.name : 'Click to upload a document (TXT, MD, DOC, PDF)'}
                  </span>
                </label>
              </div>
              {formData.file && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                  <Icon name="file-text-bold-duotone" size={16} className="text-blue-600" />
                  <span className="text-blue-800 text-sm">
                    {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
                  </span>
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        file: null,
                        fileContent: ''
                      }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="ml-auto text-blue-600 hover:text-blue-800"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Upload a syllabus, course outline, or any document with relevant content
              </p>
            </div>

            {generationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="danger-circle-bold-duotone" size={20} className="text-red-600" />
                  <p className="text-red-800">{generationError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGeneratePath}
              disabled={isGenerating || !formData.goalTopic.trim() || !formData.currentStanding.trim()}
              className="gradient-button text-white px-8 py-3 rounded-lg font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Icon name="spinner-bold-duotone" size={20} className="animate-spin" />
                  Generating Your Learning Path...
                </>
              ) : (
                <>
                  <Icon name="brain-bold-duotone" size={20} />
                  Generate AI Learning Path
                </>
              )}
            </button>

            {isGenerating && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="spinner-bold-duotone" size={24} className="animate-spin text-blue-600" />
                  <div>
                    <p className="text-blue-800 font-medium">AI is creating your personalized learning path...</p>
                    <p className="text-blue-600 text-sm">This may take 1-2 minutes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Learning Paths */}
      {activeTab === 'paths' && (
        <div>
          {loading ? (
            <div className="card p-8 text-center">
              <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your learning paths...</p>
            </div>
          ) : error ? (
            <div className="card p-8 text-center">
              <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Learning Paths</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={loadPersonalLearningPaths}
                className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          ) : personalPaths.length === 0 ? (
            <div className="card p-8 text-center">
              <Icon name="target-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No learning paths yet</h3>
              <p className="text-gray-600 mb-4">Create your first personalized learning path to get started</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
              >
                Create Learning Path
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {personalPaths.map((path) => (
                <div key={path.id} className="card p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold text-gray-900">{path.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(path.status)}`}>
                              {path.status.charAt(0).toUpperCase() + path.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{path.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Icon name="target-bold-duotone" size={16} />
                              <span>Goal: {path.goal_topic}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="user-rounded-bold-duotone" size={16} />
                              <span>Level: {path.current_standing}</span>
                            </div>
                            {path.exam_date && (
                              <div className="flex items-center gap-1">
                                <Icon name="calendar-bold-duotone" size={16} />
                                <span>Exam: {new Date(path.exam_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Icon name="book-bookmark-bold-duotone" size={16} />
                              <span>{path.total_lessons} lessons</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-gray-900">{path.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#2727E6] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${path.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{path.completed_lessons} of {path.total_lessons} lessons completed</span>
                          <span>Created on {new Date(path.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleViewPath(path.id)}
                          className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                          <Icon name="play-circle-bold-duotone" size={16} />
                          {path.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                          <Icon name="calendar-bold-duotone" size={16} />
                          View Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-12 card p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Benefits of Personalized Learning Paths</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tailored to Your Goals</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>AI-generated curriculum based on your specific learning goals</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Adapts to your current knowledge level</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Optimized study schedule for exam preparation</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Structured Learning Experience</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Clear progression from basics to advanced concepts</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Interactive quizzes and flashcards for each lesson</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Daily schedule to keep you on track</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLearningPath;