import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { AILessonService, type StudentPersonalLesson, type TavusPersonalConversationResponse, type QuizQuestion, type Quiz, type Flashcard } from '../../services/aiLessonService';

const StudentPersonalLesson: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lesson');
  const [lesson, setLesson] = useState<StudentPersonalLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tavusLoading, setTavusLoading] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [tavusError, setTavusError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizSettings, setQuizSettings] = useState({
    numQuestions: 5,
    questionType: 'mcq' as 'mcq' | 'true_false'
  });
  const [notes, setNotes] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResumeOptions, setShowResumeOptions] = useState(false);
  const [lastCompletedSegmentIndex, setLastCompletedSegmentIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadPersonalLesson(id);
      loadQuiz(id);
      loadFlashcards(id);
      loadNotes(id);
    }
  }, [id]);

  const loadPersonalLesson = async (lessonId: string) => {
    try {
      setLoading(true);
      setError(null);
      const lessonData = await AILessonService.getPersonalLesson(lessonId);
      setLesson(lessonData);
      
      // Check if there's progress data
      const progressData = await AILessonService.getPersonalLessonProgress(lessonId);
      if (progressData && progressData.last_completed_segment_index > 0 && !progressData.completed) {
        setLastCompletedSegmentIndex(progressData.last_completed_segment_index);
        setShowResumeOptions(true);
      } else {
        setShowResumeOptions(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personal lesson');
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async (lessonId: string) => {
    try {
      const quizData = await AILessonService.getPersonalLessonQuiz(lessonId);
      setQuiz(quizData);
    } catch (err) {
      // Quiz might not exist, which is fine
      console.log('No quiz found for this personal lesson');
    }
  };

  const loadFlashcards = async (lessonId: string) => {
    try {
      const flashcardsData = await AILessonService.getPersonalLessonFlashcards(lessonId);
      setFlashcards(flashcardsData.flashcards);
    } catch (err) {
      console.log('No flashcards found for this lesson');
    }
  };

  const loadNotes = (lessonId: string) => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem(`personal-notes-${lessonId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  };

  const saveNotes = (lessonId: string, notes: string) => {
    // Save notes to localStorage
    localStorage.setItem(`personal-notes-${lessonId}`, notes);
  };

  const startTavusConversation = async (startFromBeginning: boolean = false) => {
    if (!lesson) return;

    try {
      setTavusLoading(true);
      setTavusError(null);
      const response: TavusPersonalConversationResponse = await AILessonService.startTavusPersonalConversation(
        lesson.id,
        startFromBeginning
      );
      setConversationUrl(response.conversation_url);
      setShowResumeOptions(false);
    } catch (err) {
      setTavusError(err instanceof Error ? err.message : 'Failed to start AI conversation');
    } finally {
      setTavusLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleBackToAITutor = () => {
    navigate('/student/dashboard/ai-tutor');
  };

  const markLessonComplete = async () => {
    if (!lesson) return;
    
    try {
      // Count the total number of segments in the lesson script
      const segments = lesson.lesson_script.split(/^## /m);
      const totalSegments = segments.length;
      
      await AILessonService.updatePersonalLessonProgress(
        lesson.id,
        true,
        totalSegments
      );
      
      // Reload lesson to update progress
      await loadPersonalLesson(id!);
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    }
  };

  const generateQuiz = async () => {
    if (!lesson) return;
    
    try {
      setIsGeneratingQuiz(true);
      setError(null);
      
      const generatedQuiz = await AILessonService.generatePersonalLessonQuiz(
        lesson.id,
        quizSettings.numQuestions,
        quizSettings.questionType
      );
      
      setQuiz(generatedQuiz);
      setActiveTab('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const generateFlashcards = async () => {
    if (!lesson) return;
    
    try {
      setIsGeneratingFlashcards(true);
      
      const flashcardsData = await AILessonService.generatePersonalLessonFlashcards(
        lesson.id,
        5 // Number of flashcards
      );
      
      setFlashcards(flashcardsData.flashcards);
      setActiveTab('flashcards');
      
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setCurrentFlashcard(prev => (prev + 1) % flashcards.length);
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setCurrentFlashcard(prev => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (lesson) {
      saveNotes(lesson.id.toString(), newNotes);
    }
  };

  // Format lesson script for proper display
  const formatLessonScript = (script: string) => {
    return script
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #1f2937;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0; color: #1f2937;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.75rem; font-weight: 800; margin: 2rem 0 1rem 0; color: #1f2937;">$1</h1>')
      .replace(/^- (.*$)/gim, '<li style="margin: 0.25rem 0; list-style-type: disc; margin-left: 1.5rem;">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin: 0.25rem 0; list-style-type: decimal; margin-left: 1.5rem;">$2</li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading your personal lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lesson</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleBackToAITutor}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to AI Tutor
          </button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-600 mb-4">The requested personal lesson could not be found.</p>
          <button 
            onClick={handleBackToAITutor}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to AI Tutor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={handleBackToAITutor}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <Icon name="arrow-left-bold-duotone" size={20} />
          Back to AI Tutor
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <p className="text-gray-600">Personal AI-Generated Lesson</p>
          </div>
          <div className="text-right">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Icon name="brain-bold-duotone" size={14} />
              AI Generated
            </span>
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {lesson.duration}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Tavus CVI Agent Section - Full Width */}
        <div className="card p-0 overflow-hidden mb-6">
          <div className="relative">
            {conversationUrl ? (
              <div className="h-96 w-full">
                <iframe
                  src={conversationUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="AI Personal Tutor Conversation"
                  allow="camera; microphone; fullscreen"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#2727E6] to-purple-600 h-96 flex items-center justify-center text-white relative">
                <div className="text-center">
                  {tavusLoading ? (
                    <>
                      <Icon name="spinner-bold-duotone" size={48} className="animate-spin mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Loading Your Personal AI Tutor...</h2>
                      <p className="text-purple-100">Preparing your personalized lesson experience</p>
                    </>
                  ) : tavusError ? (
                    <>
                      <Icon name="danger-circle-bold-duotone" size={48} className="mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
                      <p className="text-purple-100 mb-4">{tavusError}</p>
                      <button
                        onClick={() => startTavusConversation(false)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Try Again
                      </button>
                    </>
                  ) : showResumeOptions ? (
                    <>
                      <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="play-circle-bold-duotone" size={32} />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Continue Your Lesson</h2>
                      <p className="text-purple-100 mb-6">You've already started this lesson. Would you like to continue where you left off or start from the beginning?</p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => startTavusConversation(false)}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          <Icon name="play-circle-bold-duotone" size={20} />
                          Continue Lesson
                        </button>
                        <button
                          onClick={() => startTavusConversation(true)}
                          className="bg-white bg-opacity-10 hover:bg-opacity-20 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          <Icon name="refresh-circle-bold-duotone" size={20} />
                          Start from Beginning
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="brain-bold-duotone" size={32} />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Start Your Personal AI Lesson</h2>
                      <p className="text-purple-100 mb-6">Your AI tutor is ready to teach you about "{lesson.title}"</p>
                      <button
                        onClick={() => startTavusConversation(false)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Icon name="play-circle-bold-duotone" size={20} />
                        Start AI Conversation
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Content Tabs */}
        <div className="card p-0 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('lesson')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'lesson'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lesson Script
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'quiz'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Knowledge Check
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'flashcards'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Notes
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'lesson' && (
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatLessonScript(lesson.lesson_script) }}
                  style={{ lineHeight: '1.7' }}
                />
              </div>
            )}

            {activeTab === 'quiz' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Knowledge Check</h3>
                
                {!quiz ? (
                  <div className="mb-8">
                    <div className="p-6 bg-blue-50 rounded-lg mb-6">
                      <div className="flex items-start gap-3">
                        <Icon name="help-circle-bold-duotone" size={24} className="text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Generate a Quiz for This Lesson</h4>
                          <p className="text-blue-700 mb-4">
                            Test your understanding of this lesson with an AI-generated quiz. The quiz will be based on the content of this lesson.
                          </p>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-800 mb-1">
                                Number of Questions
                              </label>
                              <select
                                value={quizSettings.numQuestions}
                                onChange={(e) => setQuizSettings({
                                  ...quizSettings,
                                  numQuestions: parseInt(e.target.value)
                                })}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value={3}>3 Questions</option>
                                <option value={5}>5 Questions</option>
                                <option value={10}>10 Questions</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-800 mb-1">
                                Question Type
                              </label>
                              <select
                                value={quizSettings.questionType}
                                onChange={(e) => setQuizSettings({
                                  ...quizSettings,
                                  questionType: e.target.value as 'mcq' | 'true_false'
                                })}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="mcq">Multiple Choice</option>
                                <option value="true_false">True/False</option>
                              </select>
                            </div>
                          </div>
                          
                          <button
                            onClick={generateQuiz}
                            disabled={isGeneratingQuiz}
                            className="gradient-button text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingQuiz ? (
                              <>
                                <Icon name="spinner-bold-duotone" size={20} className="animate-spin" />
                                Generating Quiz...
                              </>
                            ) : (
                              <>
                                <Icon name="brain-bold-duotone" size={18} />
                                Generate Quiz
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center py-8">
                      <Icon name="help-circle-bold-duotone" size={64} className="text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">No Quiz Available Yet</h4>
                      <p className="text-gray-500">
                        Generate a quiz to test your knowledge of this lesson
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {quiz.questions.map((question, qIndex) => (
                      <div key={question.id} className="mb-8">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">{question.question}</h4>
                        
                        <div className="space-y-3">
                          {question.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(question.id, index)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                selectedAnswers[question.id] === index
                                  ? selectedAnswers[question.id] === question.correct_answer
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-red-500 bg-red-50'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  selectedAnswers[question.id] === index
                                    ? selectedAnswers[question.id] === question.correct_answer
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : 'border-red-500 bg-red-500 text-white'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedAnswers[question.id] === index && (
                                    selectedAnswers[question.id] === question.correct_answer ? (
                                      <Icon name="check-circle-bold-duotone" size={16} />
                                    ) : (
                                      '✕'
                                    )
                                  )}
                                </div>
                                <span className="font-medium">
                                  {question.type === 'mcq' ? String.fromCharCode(65 + index) : (index === 0 ? 'T' : 'F')}.
                                </span>
                                <span>{option}</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        {selectedAnswers[question.id] !== undefined && (
                          <div className={`mt-4 p-4 rounded-lg ${
                            selectedAnswers[question.id] === question.correct_answer
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <h5 className={`font-semibold mb-2 ${
                              selectedAnswers[question.id] === question.correct_answer
                                ? 'text-green-800'
                                : 'text-red-800'
                            }`}>
                              {selectedAnswers[question.id] === question.correct_answer ? 'Correct!' : 'Incorrect'}
                            </h5>
                            <p className={`text-sm ${
                              selectedAnswers[question.id] === question.correct_answer
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}>
                              {question.explanation || 'The correct answer is ' + 
                                (question.type === 'mcq' 
                                  ? String.fromCharCode(65 + question.correct_answer) 
                                  : question.correct_answer === 0 ? 'True' : 'False')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Flashcards</h3>
                  {flashcards.length === 0 && (
                    <button
                      onClick={generateFlashcards}
                      disabled={isGeneratingFlashcards}
                      className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingFlashcards ? (
                        <>
                          <Icon name="spinner-bold-duotone" size={16} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Icon name="brain-bold-duotone" size={16} />
                          Generate Flashcards
                        </>
                      )}
                    </button>
                  )}
                </div>

                {flashcards.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="cards-bold-duotone" size={64} className="text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">No Flashcards Available</h4>
                    <p className="text-gray-500 mb-6">
                      Generate flashcards to help you memorize key concepts from this lesson
                    </p>
                    <button
                      onClick={generateFlashcards}
                      disabled={isGeneratingFlashcards}
                      className="gradient-button text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingFlashcards ? (
                        <>
                          <Icon name="spinner-bold-duotone" size={20} className="animate-spin" />
                          Generating Flashcards...
                        </>
                      ) : (
                        <>
                          <Icon name="brain-bold-duotone" size={20} />
                          Generate AI Flashcards
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 flex justify-between items-center">
                      <p className="text-gray-600">
                        Card {currentFlashcard + 1} of {flashcards.length}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFlashcards([])}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          Reset All
                        </button>
                      </div>
                    </div>

                    <div className="mb-6 perspective-1000">
                      <div 
                        className="relative h-64 w-full cursor-pointer transition-transform duration-500"
                        onClick={handleFlipCard}
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* Front of card */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-md"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden'
                          }}
                        >
                          <div className="text-center">
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">Question</h4>
                            <p className="text-gray-700">{flashcards[currentFlashcard]?.front}</p>
                            <p className="text-sm text-gray-500 mt-4">Click to flip</p>
                          </div>
                        </div>
                        
                        {/* Back of card */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100 shadow-md"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)'
                          }}
                        >
                          <div className="text-center">
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">Answer</h4>
                            <p className="text-gray-700">{flashcards[currentFlashcard]?.back}</p>
                            <p className="text-sm text-gray-500 mt-4">Click to flip</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={handlePrevFlashcard}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Icon name="arrow-left-bold-duotone" size={16} />
                        Previous
                      </button>
                      <button
                        onClick={handleNextFlashcard}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        Next
                        <Icon name="arrow-right-bold-duotone" size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">My Notes</h3>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Take notes on this lesson here..."
                  className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="mt-4 text-sm text-gray-500">
                  Notes are saved automatically and will be available when you return to this lesson.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={markLessonComplete}
            className="w-full py-2 px-4 rounded-lg font-medium gradient-button text-white flex items-center justify-center gap-2"
          >
            <Icon name="check-circle-bold-duotone" size={16} />
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPersonalLesson;