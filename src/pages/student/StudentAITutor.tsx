import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { AILessonService, type StudentPersonalLesson } from '../../services/aiLessonService';

const StudentAITutor: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [personalLessons, setPersonalLessons] = useState<StudentPersonalLesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [errorLoadingLessons, setErrorLoadingLessons] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showFeatureGuide, setShowFeatureGuide] = useState(true);

  useEffect(() => {
    loadPersonalLessons();
    
    // Check if feature guide has been dismissed before
    const featureGuideDismissed = localStorage.getItem('aiTutorGuideDismissed');
    if (featureGuideDismissed === 'true') {
      setShowFeatureGuide(false);
    }
  }, []);

  const loadPersonalLessons = async () => {
    try {
      setLoadingLessons(true);
      setErrorLoadingLessons(null);
      const lessons = await AILessonService.getStudentPersonalLessons();
      setPersonalLessons(lessons);
    } catch (error) {
      setErrorLoadingLessons(error instanceof Error ? error.message : 'Failed to load personal lessons');
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleGenerateLesson = async () => {
    if (!topic.trim()) return;
    
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      const response = await AILessonService.generateAILesson(topic, fileContent || undefined);
      
      // Navigate to the newly created personal lesson
      navigate(`/student/dashboard/personal-lessons/${response.lesson_id}`);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate lesson');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    
    try {
      await AILessonService.deletePersonalLesson(lessonId);
      await loadPersonalLessons(); // Reload the list
    } catch (error) {
      alert('Failed to delete lesson: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getStatusColor = (createdAt: string) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated === 0) return 'bg-green-100 text-green-800';
    if (daysSinceCreated <= 7) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (createdAt: string) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated === 0) return 'New';
    if (daysSinceCreated <= 7) return 'Recent';
    return 'Older';
  };

  const dismissFeatureGuide = () => {
    setShowFeatureGuide(false);
    localStorage.setItem('aiTutorGuideDismissed', 'true');
  };

  const dismissFeatureGuideWithConfirmation = () => {
    if (window.confirm("Are you sure you want to hide this guide? It won't appear again.")) {
      dismissFeatureGuide();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Personal Tutor</h1>
        <p className="text-gray-600">Generate personalized lessons on any topic with AI</p>
      </div>

      {/* Feature Guide */}
      {showFeatureGuide && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="brain-bold-duotone" size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How the AI Tutor Works</h3>
                <p className="text-gray-700 mb-4">
                  The AI Tutor creates personalized lessons on any topic you want to learn. Here's how to use it:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Creating a Lesson:</p>
                    <ol className="space-y-1 text-gray-700 list-decimal list-inside">
                      <li>Enter a specific topic you want to learn about</li>
                      <li>Optionally upload a document for context</li>
                      <li>Click "Generate AI Lesson"</li>
                      <li>Wait while our AI creates your personalized lesson</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Learning Features:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Interactive AI video tutor explains concepts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Generate quizzes to test your knowledge</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Create flashcards for effective memorization</span>
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

      {/* AI Lesson Generator */}
      <div className="card p-8 mb-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="brain-bold-duotone" size={40} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Personal AI Tutor</h2>
          <p className="text-gray-600">Create a personalized lesson on any topic, optionally upload documents for additional context</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to learn about? *
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'Quantum Physics', 'Machine Learning', 'Ancient Roman History'"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                id="document"
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
                  {file ? file.name : 'Click to upload a document (TXT, MD, DOC, PDF)'}
                </span>
              </label>
            </div>
            {file && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                <Icon name="file-text-bold-duotone" size={16} className="text-blue-600" />
                <span className="text-blue-800 text-sm">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
                <button
                  onClick={() => {
                    setFile(null);
                    setFileContent('');
                  }}
                  className="ml-auto text-blue-600 hover:text-blue-800"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {generationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="danger-circle-bold-duotone" size={20} className="text-red-600" />
                <p className="text-red-800">{generationError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateLesson}
            disabled={!topic.trim() || isGenerating}
            className="gradient-button text-white px-8 py-3 rounded-lg font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Icon name="spinner-bold-duotone" size={20} className="animate-spin" />
                Generating Your Lesson...
              </>
            ) : (
              <>
                <Icon name="send-bold-duotone" size={20} />
                Generate AI Lesson
              </>
            )}
          </button>

          {isGenerating && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="spinner-bold-duotone" size={24} className="animate-spin text-blue-600" />
                <div>
                  <p className="text-blue-800 font-medium">AI is creating your personalized lesson...</p>
                  <p className="text-blue-600 text-sm">This may take 30-60 seconds</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Personal Lessons History */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Personal Lessons</h2>
          {!loadingLessons && (
            <span className="text-gray-600">{personalLessons.length} lessons created</span>
          )}
        </div>

        {loadingLessons ? (
          <div className="card p-8 text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your personal lessons...</p>
          </div>
        ) : errorLoadingLessons ? (
          <div className="card p-8 text-center">
            <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lessons</h3>
            <p className="text-gray-600 mb-4">{errorLoadingLessons}</p>
            <button 
              onClick={loadPersonalLessons}
              className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        ) : personalLessons.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="book-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No personal lessons yet</h3>
            <p className="text-gray-600">Generate your first AI-powered lesson above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {personalLessons.map((lesson) => (
              <div key={lesson.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.created_at)}`}>
                        {getStatusText(lesson.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Icon name="clock-circle-bold-duotone" size={16} />
                        {lesson.duration}
                      </div>
                      <span>Created on {new Date(lesson.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate(`/student/dashboard/personal-lessons/${lesson.id}`)}
                        className="gradient-button text-white px-4 py-2 rounded-lg font-medium text-sm"
                      >
                        Start Learning
                      </button>
                      <button className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
                        View Script
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2"
                  >
                    <Icon name="trash-bin-trash-bold-duotone" size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-12 card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips for Better AI Lessons</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• Be specific about your learning goals and current knowledge level</li>
          <li>• Upload relevant documents to provide additional context for the AI</li>
          <li>• Use clear, descriptive topics (e.g., "Introduction to Quantum Mechanics" vs "Physics")</li>
          <li>• The AI will create comprehensive lessons with examples and practice exercises</li>
          <li>• Each lesson includes an interactive AI tutor for personalized learning</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentAITutor;