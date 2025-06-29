import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CertificationService } from '../../services/certificationService';
import { supabase } from '../../lib/supabase';

interface CertificationLesson {
  id: number;
  title: string;
  lesson_script: string;
  duration: string;
  module: {
    id: number;
    title: string;
    certification: {
      id: number;
      title: string;
    };
  };
  progress: {
    completed: boolean;
    completed_at: string | null;
    last_completed_segment_index: number;
  };
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface Quiz {
  id: number;
  questions: QuizQuestion[];
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const CertificationLesson: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lesson');
  const [lesson, setLesson] = useState<CertificationLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
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
  const [tavusLoading, setTavusLoading] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [tavusError, setTavusError] = useState<string | null>(null);
  const [showResumeOptions, setShowResumeOptions] = useState(false);

  useEffect(() => {
    if (id) {
      loadLesson(id);
      loadQuiz(id);
      loadFlashcards(id);
      loadNotes(id);
    }
  }, [id]);

  const loadLesson = async (lessonId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-certification-lesson/${lessonId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load lesson');
      }
      
      const data = await response.json();
      setLesson(data.lesson);
      
      // Check if lesson is partially completed to show resume options
      if (data.lesson.progress && 
          data.lesson.progress.last_completed_segment_index && 
          data.lesson.progress.last_completed_segment_index > 0 && 
          !data.lesson.progress.completed) {
        setShowResumeOptions(true);
      } else {
        setShowResumeOptions(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async (lessonId: string) => {
    try {
      setQuizLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-certification-quiz/${lessonId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        // Quiz might not exist, which is fine
        console.log('No quiz found for this lesson');
        return;
      }
      
      const data = await response.json();
      setQuiz(data.quiz);
    } catch (err) {
      // Quiz might not exist, which is fine
      console.log('No quiz found for this lesson');
    } finally {
      setQuizLoading(false);
    }
  };

  const loadFlashcards = async (lessonId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-certification-flashcards/${lessonId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        console.log('No flashcards found for this lesson');
        return;
      }
      
      const data = await response.json();
      setFlashcards(data.flashcards);
    } catch (err) {
      console.log('No flashcards found for this lesson');
    }
  };

  const loadNotes = (lessonId: string) => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem(`certification-notes-${lessonId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  };

  const saveNotes = (lessonId: string, notes: string) => {
    // Save notes to localStorage
    localStorage.setItem(`certification-notes-${lessonId}`, notes);
  };

  const startTavusConversation = async (startFromBeginning: boolean = false) => {
    if (!lesson) return;

    try {
      setTavusLoading(true);
      setTavusError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-certification-conversation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            lesson_id: lesson.id,
            start_from_beginning: startFromBeginning
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start AI conversation');
      }
      
      const data = await response.json();
      setConversationUrl(data.conversation_url);
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

  const submitQuizAnswer = async (questionId: string) => {
    if (!quiz || !lesson || selectedAnswers[questionId] === undefined) return;

    try {
      const currentQuestion = quiz.questions.find((q: any) => q.id === questionId);
      if (!currentQuestion) return;

      const isCorrect = selectedAnswers[questionId] === currentQuestion.correct_answer;
      const score = isCorrect ? 100 : 0;

      await CertificationService.submitQuizAttempt(lesson.id, quiz.id, {
        [questionId]: selectedAnswers[questionId]
      }, score);

      // Mark lesson as complete if quiz is passed
      if (isCorrect) {
        await markLessonComplete();
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    }
  };

  const handleBackToCertification = () => {
    if (lesson) {
      navigate(`/student/dashboard/certification/${lesson.module.certification.id}`);
    } else {
      navigate('/student/dashboard/certifications');
    }
  };

  const markLessonComplete = async () => {
    if (!lesson) return;
    
    try {
      await CertificationService.markLessonComplete(lesson.id);
      // Reload lesson to update progress
      await loadLesson(id!);
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    }
  };

  const generateQuiz = async () => {
    if (!lesson) return;
    
    try {
      setIsGeneratingQuiz(true);
      setError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certification-quiz`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: lesson.id,
            num_questions: quizSettings.numQuestions,
            question_type: quizSettings.questionType
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }
      
      const data = await response.json();
      setQuiz(data);
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
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certification-flashcards`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: lesson.id,
            num_cards: 5
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }
      
      const data = await response.json();
      setFlashcards(data.flashcards);
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
            <p className="text-gray-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lesson</h2>
          <p className="text-gray-600 mb-4">{error || 'Lesson not found'}</p>
          <button 
            onClick={handleBackToCertification}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Certification
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
          onClick={handleBackToCertification}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <Icon name="arrow-left-bold-duotone" size={20} />
          Back to {lesson.module.certification.title}
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600">Module: {lesson.module.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <p className="text-gray-600">{lesson.module.certification.title}</p>
          </div>
          <div className="text-right">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {lesson.duration}
            </span>
            {lesson.progress.completed && (
              <div className="mt-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Icon name="check-circle-bold-duotone" size={14} />
                  Completed
                </span>
              </div>
            )}
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
                  title="AI Tutor Conversation"
                  allow="camera; microphone; fullscreen"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#2727E6] to-[#1d1db8] h-96 flex items-center justify-center text-white relative">
                <div className="text-center">
                  {tavusLoading ? (
                    <>
                      <Icon name="spinner-bold-duotone" size={48} className="animate-spin mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Loading AI Tutor...</h2>
                      <p className="text-blue-100">Preparing your personalized lesson experience</p>
                    </>
                  ) : tavusError ? (
                    <>
                      <Icon name="danger-circle-bold-duotone" size={48} className="mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
                      <p className="text-blue-100 mb-4">{tavusError}</p>
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
                      <p className="text-blue-100 mb-6">You've already started this lesson. Would you like to continue where you left off or start from the beginning?</p>
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
                        <Icon name="play-circle-bold-duotone" size={32} />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Start Your AI Lesson</h2>
                      <p className="text-blue-100 mb-6">Click below to begin your interactive lesson with your AI tutor</p>
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
                    ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lesson Script
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'quiz'
                    ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Knowledge Check
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'flashcards'
                    ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
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
                                  : 'border-gray-200 hover:border-[#2727E6]/30 hover:bg-[#2727E6]/5'
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

                        {selectedAnswers[question.id] === question.correct_answer && !lesson.progress.completed && (
                          <div className="mt-6">
                            <button 
                              onClick={() => submitQuizAnswer(question.id)}
                              className="gradient-button text-white px-6 py-3 rounded-lg font-semibold"
                            >
                              Mark Lesson Complete
                            </button>
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
                  className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
            disabled={lesson.progress.completed}
          >
            <Icon name="check-circle-bold-duotone" size={16} />
            {lesson.progress.completed ? 'Lesson Completed' : 'Mark as Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificationLesson;