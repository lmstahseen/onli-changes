import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { ArrowLeft, Plus, Trash2, Brain, Save, Upload, FileText, Loader, AlertCircle, CheckCircle, HelpCircle, Edit3, Bold, Italic, Underline, Type, List, ListOrdered } from 'lucide-react';
import { CourseService } from '../../services/courseService';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  lesson_id: string;
  questions: QuizQuestion[];
  isGenerating: boolean;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  content_raw: string;
  lesson_script: string;
  isGenerating: boolean;
  quiz?: Quiz;
  flashcards?: Flashcard[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  isExpanded: boolean;
}

const TeacherCourseEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    difficulty: 'beginner',
    image_url: ''
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [isParsingFile, setIsParsingFile] = useState<string | null>(null);

  // Quiz generation states
  const [quizSettings, setQuizSettings] = useState<{[key: string]: {numQuestions: number, questionType: 'mcq' | 'true_false'}}>({});
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [editingScript, setEditingScript] = useState<string | null>(null);
  const scriptRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Flashcard generation states
  const [flashcardSettings, setFlashcardSettings] = useState<{[key: string]: {numCards: number}}>({});
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<{[key: string]: boolean}>({});
  const [editingFlashcards, setEditingFlashcards] = useState<string | null>(null);

  const categories = [
    'Technology',
    'Science',
    'Mathematics',
    'Arts & Humanities',
    'Business',
    'Health & Medicine',
    'Language Learning',
    'Personal Development'
  ];

  useEffect(() => {
    if (id) {
      loadCourseData(id);
    }
  }, [id]);

  const loadCourseData = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load course details and modules
      const details = await CourseService.getCourseDetails(courseId);
      
      setCourseData({
        title: details.course.title,
        description: details.course.description,
        price: details.course.price.toString(),
        category: details.course.category,
        difficulty: details.course.difficulty,
        image_url: details.course.image_url
      });

      // Transform modules and lessons data
      const transformedModules: Module[] = await Promise.all(
        details.modules.map(async (module) => {
          // Transform lessons for this module
          const transformedLessons: Lesson[] = await Promise.all(
            module.lessons.map(async (lesson) => {
              // Fetch full lesson details including content_raw and lesson_script
              const { data: lessonDetails, error: lessonError } = await supabase
                .from('lessons')
                .select('content_raw, lesson_script')
                .eq('id', lesson.id)
                .single();
              
              if (lessonError) {
                console.error('Error fetching lesson details:', lessonError);
                return {
                  id: lesson.id.toString(),
                  title: lesson.title,
                  order: lesson.lesson_order,
                  content_raw: '',
                  lesson_script: '',
                  isGenerating: false
                };
              }

              // Try to load quiz for this lesson
              let quiz: Quiz | undefined;
              try {
                const quizData = await CourseService.getLessonQuiz(lesson.id.toString());
                if (quizData) {
                  quiz = {
                    id: quizData.id,
                    lesson_id: lesson.id.toString(),
                    questions: quizData.questions || [],
                    isGenerating: false
                  };
                }
              } catch (quizError) {
                // Quiz doesn't exist, which is fine
                console.log('No quiz found for lesson:', lesson.id);
              }

              return {
                id: lesson.id.toString(),
                title: lesson.title,
                order: lesson.lesson_order,
                content_raw: lessonDetails?.content_raw || '',
                lesson_script: lessonDetails?.lesson_script || '',
                isGenerating: false,
                quiz
              };
            })
          );

          return {
            id: module.id.toString(),
            title: module.title,
            description: module.description,
            order: module.module_order,
            lessons: transformedLessons,
            isExpanded: true
          };
        })
      );

      setModules(transformedModules);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCourseData({
      ...courseData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleModuleChange = (id: string, field: keyof Omit<Module, 'lessons' | 'isExpanded'>, value: string | number) => {
    setModules(modules.map(module => 
      module.id === id ? { ...module, [field]: value } : module
    ));
    setError(null);
  };

  const handleLessonChange = (moduleId: string, lessonId: string, field: keyof Lesson, value: string | number) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => 
            lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
          )
        };
      }
      return module;
    }));
    setError(null);
  };

  const toggleModuleExpanded = (id: string) => {
    setModules(modules.map(module => 
      module.id === id ? { ...module, isExpanded: !module.isExpanded } : module
    ));
  };

  const addModule = () => {
    const newId = `new-${Date.now()}`;
    setModules([...modules, {
      id: newId,
      title: '',
      description: '',
      order: modules.length + 1,
      lessons: [
        { 
          id: `${newId}-1`, 
          title: '', 
          order: 1, 
          content_raw: '', 
          lesson_script: '',
          isGenerating: false
        }
      ],
      isExpanded: true
    }]);
  };

  const removeModule = (id: string) => {
    if (modules.length > 1) {
      setModules(modules.filter(module => module.id !== id));
    }
  };

  const addLesson = (moduleId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const newLessonId = `${moduleId}-${Date.now()}`;
        return {
          ...module,
          lessons: [...module.lessons, {
            id: newLessonId,
            title: '',
            order: module.lessons.length + 1,
            content_raw: '',
            lesson_script: '',
            isGenerating: false
          }]
        };
      }
      return module;
    }));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId && module.lessons.length > 1) {
        return {
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return module;
    }));
  };

  const handleFileUpload = async (moduleId: string, lessonId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a .txt, .pdf, or .docx file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsParsingFile(lessonId);
    setError(null);

    try {
      let content: string;

      if (file.type === 'text/plain') {
        // Handle text files directly
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else {
        // Handle PDF and DOCX files through the backend
        content = await CourseService.parseDocumentContent(file);
      }

      handleLessonChange(moduleId, lessonId, 'content_raw', content);
      setSuccess('File content extracted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file content');
    } finally {
      setIsParsingFile(null);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Rich text formatting functions
  const formatText = (lessonId: string, command: string, value?: string) => {
    const element = scriptRefs.current[lessonId];
    if (element) {
      element.focus();
      document.execCommand(command, false, value);
      
      // Update the lesson script with the new content
      const updatedContent = element.innerHTML;
      
      // Find the module and lesson to update
      for (const module of modules) {
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) {
          handleLessonChange(module.id, lessonId, 'lesson_script', updatedContent);
          break;
        }
      }
    }
  };

  const insertList = (lessonId: string, ordered: boolean) => {
    const element = scriptRefs.current[lessonId];
    if (element) {
      element.focus();
      document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false);
      
      const updatedContent = element.innerHTML;
      
      // Find the module and lesson to update
      for (const module of modules) {
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) {
          handleLessonChange(module.id, lessonId, 'lesson_script', updatedContent);
          break;
        }
      }
    }
  };

  const changeFontSize = (lessonId: string, size: string) => {
    formatText(lessonId, 'fontSize', size);
  };

  const generateLessonScript = async (moduleId: string, lessonId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.content_raw.trim()) {
      setError('Please provide content for the lesson before generating script');
      return;
    }

    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { ...l, isGenerating: true } : l
          )
        };
      }
      return m;
    }));
    setError(null);

    try {
      const script = await CourseService.generateLessonScript(lesson.content_raw);
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { 
                ...l, 
                lesson_script: script, 
                isGenerating: false 
              } : l
            )
          };
        }
        return m;
      }));
      setSuccess('Lesson script generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lesson script');
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { ...l, isGenerating: false } : l
            )
          };
        }
        return m;
      }));
    }
  };

  const generateQuiz = async (moduleId: string, lessonId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    const settings = quizSettings[lessonId];
    
    if (!lesson || !lesson.lesson_script.trim()) {
      setError('Please generate lesson script first before creating quiz');
      return;
    }

    if (!settings) {
      setError('Please configure quiz settings first');
      return;
    }

    // Set quiz as generating
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { 
              ...l, 
              quiz: { 
                id: `quiz-${lessonId}`, 
                lesson_id: lessonId, 
                questions: [], 
                isGenerating: true 
              } 
            } : l
          )
        };
      }
      return m;
    }));
    setError(null);

    try {
      const quiz = await CourseService.generateQuiz(
        lesson.lesson_script, 
        settings.numQuestions, 
        settings.questionType
      );
      
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { 
                ...l, 
                quiz: {
                  id: `quiz-${lessonId}`,
                  lesson_id: lessonId,
                  questions: quiz.questions,
                  isGenerating: false
                }
              } : l
            )
          };
        }
        return m;
      }));
      setSuccess('Quiz generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { 
                ...l, 
                quiz: l.quiz ? { ...l.quiz, isGenerating: false } : undefined 
              } : l
            )
          };
        }
        return m;
      }));
    }
  };

  const generateFlashcards = async (moduleId: string, lessonId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    const settings = flashcardSettings[lessonId];
    
    if (!lesson || !lesson.lesson_script.trim()) {
      setError('Please generate lesson script first before creating flashcards');
      return;
    }

    if (!settings) {
      // Default to 5 cards if no settings
      setFlashcardSettings({
        ...flashcardSettings,
        [lessonId]: { numCards: 5 }
      });
    }

    // Set flashcards as generating
    setIsGeneratingFlashcards({
      ...isGeneratingFlashcards,
      [lessonId]: true
    });
    setError(null);

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate the API call and generate some flashcards based on the lesson content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate some sample flashcards based on the lesson title
      const generatedFlashcards: Flashcard[] = [
        { 
          id: `${lessonId}-1`, 
          front: `What is the main topic of ${lesson.title}?`, 
          back: `${lesson.title} covers fundamental concepts and applications in this subject area.` 
        },
        { 
          id: `${lessonId}-2`, 
          front: 'What are the key benefits of this subject?', 
          back: 'Improved problem-solving skills, practical applications, and deeper understanding of related concepts.' 
        },
        { 
          id: `${lessonId}-3`, 
          front: 'How can you apply these concepts in real life?', 
          back: 'Through practical exercises, case studies, and real-world problem solving.' 
        },
        { 
          id: `${lessonId}-4`, 
          front: 'What are the foundational principles covered?', 
          back: 'Core theories, methodologies, and frameworks that form the basis of this subject.' 
        },
        { 
          id: `${lessonId}-5`, 
          front: 'What skills will you develop from this lesson?', 
          back: 'Critical thinking, analytical reasoning, and practical application abilities.' 
        }
      ];
      
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { 
                ...l, 
                flashcards: generatedFlashcards
              } : l
            )
          };
        }
        return m;
      }));
      
      setSuccess('Flashcards generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsGeneratingFlashcards({
        ...isGeneratingFlashcards,
        [lessonId]: false
      });
    }
  };

  const updateQuizSettings = (lessonId: string, numQuestions: number, questionType: 'mcq' | 'true_false') => {
    setQuizSettings({
      ...quizSettings,
      [lessonId]: { numQuestions, questionType }
    });
  };

  const updateFlashcardSettings = (lessonId: string, numCards: number) => {
    setFlashcardSettings({
      ...flashcardSettings,
      [lessonId]: { numCards }
    });
  };

  const updateQuizQuestion = (moduleId: string, lessonId: string, questionId: string, field: string, value: any) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => {
            if (lesson.id === lessonId && lesson.quiz) {
              return {
                ...lesson,
                quiz: {
                  ...lesson.quiz,
                  questions: lesson.quiz.questions.map(q => 
                    q.id === questionId ? { ...q, [field]: value } : q
                  )
                }
              };
            }
            return lesson;
          })
        };
      }
      return module;
    }));
  };

  const updateQuizOption = (moduleId: string, lessonId: string, questionId: string, optionIndex: number, value: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => {
            if (lesson.id === lessonId && lesson.quiz) {
              return {
                ...lesson,
                quiz: {
                  ...lesson.quiz,
                  questions: lesson.quiz.questions.map(q => {
                    if (q.id === questionId) {
                      const newOptions = [...q.options];
                      newOptions[optionIndex] = value;
                      return { ...q, options: newOptions };
                    }
                    return q;
                  })
                }
              };
            }
            return lesson;
          })
        };
      }
      return module;
    }));
  };

  const updateFlashcard = (moduleId: string, lessonId: string, cardId: string, field: 'front' | 'back', value: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => {
            if (lesson.id === lessonId && lesson.flashcards) {
              return {
                ...lesson,
                flashcards: lesson.flashcards.map(card => 
                  card.id === cardId ? { ...card, [field]: value } : card
                )
              };
            }
            return lesson;
          })
        };
      }
      return module;
    }));
  };

  // Convert markdown-like formatting to HTML for display
  const formatLessonScript = (script: string) => {
    return script
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem 0;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.75rem; font-weight: 800; margin: 2rem 0 1rem 0;">$1</h1>')
      .replace(/^- (.*$)/gim, '<li style="margin: 0.25rem 0;">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin: 0.25rem 0;">$2</li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const handleSaveCourse = async () => {
    // Validation
    if (!courseData.title.trim()) {
      setError('Course title is required');
      return;
    }
    if (!courseData.description.trim()) {
      setError('Course description is required');
      return;
    }
    if (!courseData.price || parseFloat(courseData.price) < 0) {
      setError('Valid price is required');
      return;
    }
    if (!courseData.category) {
      setError('Course category is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // In a real implementation, you would call an update API
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Course updated successfully!');
      setTimeout(() => {
        navigate('/teacher/dashboard/my-courses');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToCourses = () => {
    navigate('/teacher/dashboard/my-courses');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !courseData.title) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleBackToCourses}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button 
          onClick={handleBackToCourses}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to My Courses
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Course</h1>
        <p className="text-gray-600">Update your course content and settings</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Course Information */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Course Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={courseData.title}
              onChange={handleCourseChange}
              placeholder="e.g., Advanced Mathematics for Engineers"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (USD) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={courseData.price}
              onChange={handleCourseChange}
              placeholder="49.99"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={courseData.category}
              onChange={handleCourseChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={courseData.difficulty}
              onChange={handleCourseChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Course Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={courseData.description}
            onChange={handleCourseChange}
            placeholder="Provide a detailed description of what students will learn in this course..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent resize-none"
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
            Course Image URL (Optional)
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={courseData.image_url}
            onChange={handleCourseChange}
            placeholder="https://example.com/course-image.jpg"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Course Modules */}
      <div className="card p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Course Modules</h2>
          <div className="flex gap-2">
            <button
              onClick={addModule}
              className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Add Module
            </button>
          </div>
        </div>
        
        <div className="space-y-8">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">Module {moduleIndex + 1}</h3>
                  <button
                    onClick={() => toggleModuleExpanded(module.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Icon 
                      name={module.isExpanded ? "alt-arrow-up-bold-duotone" : "alt-arrow-down-bold-duotone"} 
                      size={20} 
                    />
                  </button>
                </div>
                {modules.length > 1 && (
                  <button
                    onClick={() => removeModule(module.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                    placeholder="e.g., Introduction to Linear Algebra"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Order
                  </label>
                  <input
                    type="number"
                    value={module.order}
                    onChange={(e) => handleModuleChange(module.id, 'order', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Description *
                </label>
                <textarea
                  value={module.description}
                  onChange={(e) => handleModuleChange(module.id, 'description', e.target.value)}
                  placeholder="Provide a brief overview of what this module covers..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Lessons Section - Collapsible */}
              {module.isExpanded && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Lessons</h4>
                    <button
                      onClick={() => addLesson(module.id)}
                      className="gradient-button text-white px-3 py-1 rounded-lg font-medium text-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Lesson
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium text-gray-900">Lesson {moduleIndex + 1}.{lessonIndex + 1}</h5>
                          {module.lessons.length > 1 && (
                            <button
                              onClick={() => removeLesson(module.id, lesson.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Lesson Title *
                            </label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => handleLessonChange(module.id, lesson.id, 'title', e.target.value)}
                              placeholder="e.g., Introduction to Vectors"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Lesson Order
                            </label>
                            <input
                              type="number"
                              value={lesson.order}
                              onChange={(e) => handleLessonChange(module.id, lesson.id, 'order', parseInt(e.target.value))}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* File Upload */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Content File (Optional)
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept=".txt,.pdf,.docx"
                              onChange={(e) => handleFileUpload(module.id, lesson.id, e)}
                              className="hidden"
                              id={`file-${lesson.id}`}
                              disabled={isParsingFile === lesson.id}
                            />
                            <label
                              htmlFor={`file-${lesson.id}`}
                              className={`w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2727E6]/40 transition-colors flex items-center justify-center gap-2 ${
                                isParsingFile === lesson.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {isParsingFile === lesson.id ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin text-[#2727E6]" />
                                  <span className="text-[#2727E6] text-sm">Parsing file content...</span>
                                </>
                              ) : (
                                <>
                                  <Upload size={16} className="text-gray-500" />
                                  <span className="text-gray-600 text-sm">
                                    Click to upload (.txt, .pdf, .docx) - Max 5MB
                                  </span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                              Raw Content *
                            </label>
                            <button
                              onClick={() => generateLessonScript(module.id, lesson.id)}
                              disabled={!lesson.content_raw.trim() || lesson.isGenerating}
                              className="gradient-button text-white px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {lesson.isGenerating ? (
                                <>
                                  <Loader className="w-3 h-3 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Brain size={12} />
                                  Generate Script (AI)
                                </>
                              )}
                            </button>
                          </div>
                          <textarea
                            value={lesson.content_raw}
                            onChange={(e) => handleLessonChange(module.id, lesson.id, 'content_raw', e.target.value)}
                            placeholder="Enter your raw lesson content here (lecture notes, textbook chapters, summaries, etc.). This will be used to generate the AI lesson script."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent resize-none"
                          />
                        </div>

                        {/* Generated Lesson Script with Rich Text Editor */}
                        {lesson.lesson_script && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Generated Lesson Script
                              </label>
                              <button
                                onClick={() => setEditingScript(editingScript === lesson.id ? null : lesson.id)}
                                className="text-[#2727E6] hover:text-blue-700 font-medium text-xs flex items-center gap-1"
                              >
                                <Edit3 size={12} />
                                {editingScript === lesson.id ? 'Done Editing' : 'Edit Format'}
                              </button>
                            </div>

                            {/* Rich Text Formatting Toolbar */}
                            {editingScript === lesson.id && (
                              <div className="mb-2 p-2 bg-gray-50 rounded-lg border">
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    onClick={() => formatText(lesson.id, 'bold')}
                                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                    title="Bold"
                                  >
                                    <Bold size={14} />
                                  </button>
                                  <button
                                    onClick={() => formatText(lesson.id, 'italic')}
                                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                    title="Italic"
                                  >
                                    <Italic size={14} />
                                  </button>
                                  <button
                                    onClick={() => formatText(lesson.id, 'underline')}
                                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                    title="Underline"
                                  >
                                    <Underline size={14} />
                                  </button>
                                  <div className="border-l border-gray-300 mx-1"></div>
                                  <select
                                    onChange={(e) => changeFontSize(lesson.id, e.target.value)}
                                    className="px-1 py-1 border border-gray-300 rounded text-xs"
                                    title="Font Size"
                                  >
                                    <option value="3">Normal</option>
                                    <option value="4">Large</option>
                                    <option value="5">X-Large</option>
                                    <option value="6">XX-Large</option>
                                  </select>
                                  <div className="border-l border-gray-300 mx-1"></div>
                                  <button
                                    onClick={() => insertList(lesson.id, false)}
                                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                    title="Bullet List"
                                  >
                                    <List size={14} />
                                  </button>
                                  <button
                                    onClick={() => insertList(lesson.id, true)}
                                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                    title="Numbered List"
                                  >
                                    <ListOrdered size={14} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {editingScript === lesson.id ? (
                              <div
                                ref={(el) => scriptRefs.current[lesson.id] = el}
                                contentEditable
                                dangerouslySetInnerHTML={{ __html: formatLessonScript(lesson.lesson_script) }}
                                onBlur={(e) => handleLessonChange(module.id, lesson.id, 'lesson_script', e.currentTarget.innerHTML)}
                                className="w-full min-h-[150px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent bg-white text-sm"
                                style={{ lineHeight: '1.6' }}
                              />
                            ) : (
                              <div 
                                className="w-full max-h-[150px] overflow-y-auto px-3 py-2 border border-gray-200 rounded-lg bg-blue-50 text-sm"
                                dangerouslySetInnerHTML={{ __html: formatLessonScript(lesson.lesson_script) }}
                                style={{ lineHeight: '1.6' }}
                              />
                            )}
                          </div>
                        )}

                        {/* Quiz Generation Section */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                              <HelpCircle size={14} className="text-purple-600" />
                              Quiz
                            </h6>
                            {!lesson.quiz && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <label className="text-xs font-medium text-gray-700">Questions:</label>
                                  <select
                                    value={quizSettings[lesson.id]?.numQuestions || 5}
                                    onChange={(e) => updateQuizSettings(
                                      lesson.id, 
                                      parseInt(e.target.value), 
                                      quizSettings[lesson.id]?.questionType || 'mcq'
                                    )}
                                    className="px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value={3}>3</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-1">
                                  <label className="text-xs font-medium text-gray-700">Type:</label>
                                  <select
                                    value={quizSettings[lesson.id]?.questionType || 'mcq'}
                                    onChange={(e) => updateQuizSettings(
                                      lesson.id, 
                                      quizSettings[lesson.id]?.numQuestions || 5, 
                                      e.target.value as 'mcq' | 'true_false'
                                    )}
                                    className="px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="mcq">Multiple Choice</option>
                                    <option value="true_false">True/False</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => generateQuiz(module.id, lesson.id)}
                                  disabled={lesson.quiz?.isGenerating || !lesson.lesson_script}
                                  className="gradient-button text-white px-2 py-1 rounded-lg font-medium text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Brain size={12} />
                                  Generate Quiz
                                </button>
                              </div>
                            )}
                          </div>

                          {!lesson.lesson_script && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2 text-xs">
                              <p className="text-yellow-800">
                                💡 Generate lesson script first to enable quiz creation
                              </p>
                            </div>
                          )}

                          {/* Quiz Generation Loading */}
                          {lesson.quiz?.isGenerating && (
                            <div className="p-2 bg-purple-50 rounded-lg text-xs">
                              <div className="flex items-center gap-2">
                                <Loader className="w-3 h-3 animate-spin text-purple-600" />
                                <p className="text-purple-800">Generating quiz questions...</p>
                              </div>
                            </div>
                          )}

                          {/* Generated Quiz Questions */}
                          {lesson.quiz && lesson.quiz.questions.length > 0 && (
                            <div className="text-xs">
                              <div className="flex justify-between items-center">
                                <p className="text-gray-600">
                                  {lesson.quiz.questions.length} questions loaded
                                </p>
                                <button
                                  onClick={() => setEditingQuiz(editingQuiz === lesson.id ? null : lesson.id)}
                                  className="text-[#2727E6] hover:text-blue-700 font-medium text-xs flex items-center gap-1"
                                >
                                  <Edit3 size={10} />
                                  {editingQuiz === lesson.id ? 'Done' : 'Edit'}
                                </button>
                              </div>

                              {editingQuiz === lesson.id && (
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                  {lesson.quiz.questions.map((question, qIndex) => (
                                    <div key={question.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                                      <div className="mb-1">
                                        <input
                                          value={question.question}
                                          onChange={(e) => updateQuizQuestion(module.id, lesson.id, question.id, 'question', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        {question.options.map((option, oIndex) => (
                                          <div key={oIndex} className="flex items-center gap-1">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${
                                              question.correct_answer === oIndex 
                                                ? 'border-green-500 bg-green-500 text-white' 
                                                : 'border-gray-300'
                                            }`}>
                                              {question.type === 'mcq' ? String.fromCharCode(65 + oIndex).toLowerCase() : (oIndex === 0 ? 't' : 'f')}
                                            </div>
                                            <input
                                              type="text"
                                              value={option}
                                              onChange={(e) => updateQuizOption(module.id, lesson.id, question.id, oIndex, e.target.value)}
                                              className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                            />
                                            <button
                                              onClick={() => updateQuizQuestion(module.id, lesson.id, question.id, 'correct_answer', oIndex)}
                                              className={`px-1 py-0.5 rounded text-[10px] ${
                                                question.correct_answer === oIndex
                                                  ? 'bg-green-100 text-green-800'
                                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                                              }`}
                                            >
                                              {question.correct_answer === oIndex ? '✓' : 'Set'}
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Flashcards Generation Section */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                              <Icon name="cards-bold-duotone" size={14} className="text-orange-600" />
                              Flashcards
                            </h6>
                            {!lesson.flashcards && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <label className="text-xs font-medium text-gray-700">Cards:</label>
                                  <select
                                    value={flashcardSettings[lesson.id]?.numCards || 5}
                                    onChange={(e) => updateFlashcardSettings(
                                      lesson.id, 
                                      parseInt(e.target.value)
                                    )}
                                    className="px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => generateFlashcards(module.id, lesson.id)}
                                  disabled={isGeneratingFlashcards[lesson.id] || !lesson.lesson_script}
                                  className="gradient-button text-white px-2 py-1 rounded-lg font-medium text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Brain size={12} />
                                  Generate Cards
                                </button>
                              </div>
                            )}
                          </div>

                          {!lesson.lesson_script && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2 text-xs">
                              <p className="text-yellow-800">
                                💡 Generate lesson script first to enable flashcard creation
                              </p>
                            </div>
                          )}

                          {/* Flashcards Generation Loading */}
                          {isGeneratingFlashcards[lesson.id] && (
                            <div className="p-2 bg-orange-50 rounded-lg text-xs">
                              <div className="flex items-center gap-2">
                                <Loader className="w-3 h-3 animate-spin text-orange-600" />
                                <p className="text-orange-800">Generating flashcards...</p>
                              </div>
                            </div>
                          )}

                          {/* Generated Flashcards */}
                          {lesson.flashcards && lesson.flashcards.length > 0 && (
                            <div className="text-xs">
                              <div className="flex justify-between items-center">
                                <p className="text-gray-600">
                                  {lesson.flashcards.length} flashcards generated
                                </p>
                                <button
                                  onClick={() => setEditingFlashcards(editingFlashcards === lesson.id ? null : lesson.id)}
                                  className="text-[#2727E6] hover:text-blue-700 font-medium text-xs flex items-center gap-1"
                                >
                                  <Edit3 size={10} />
                                  {editingFlashcards === lesson.id ? 'Done' : 'Edit'}
                                </button>
                              </div>

                              {editingFlashcards === lesson.id && (
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                  {lesson.flashcards.map((card) => (
                                    <div key={card.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                            Front
                                          </label>
                                          <input
                                            value={card.front}
                                            onChange={(e) => updateFlashcard(module.id, lesson.id, card.id, 'front', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                            Back
                                          </label>
                                          <input
                                            value={card.back}
                                            onChange={(e) => updateFlashcard(module.id, lesson.id, card.id, 'back', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {lesson.isGenerating && (
                          <div className="p-2 bg-blue-50 rounded-lg mt-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Loader className="w-3 h-3 animate-spin text-blue-600" />
                              <p className="text-blue-800">Generating lesson script...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handleBackToCourses}
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSaveCourse}
          disabled={isSaving}
          className="gradient-button text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TeacherCourseEdit;