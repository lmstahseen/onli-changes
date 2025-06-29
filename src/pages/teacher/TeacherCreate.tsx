import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CourseService, type CreateCourseData, type CreateModuleData, type CreateLessonData, type QuizQuestion, type Flashcard } from '../../services/courseService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { v4 as uuidv4 } from 'uuid';

const TeacherCreate: React.FC = () => {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(true);
  const [courseData, setCourseData] = useState<CreateCourseData>({
    title: '',
    description: '',
    price: 29.99,
    category: 'technology',
    difficulty: 'beginner',
    image_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  });
  const [modules, setModules] = useState<{
    id?: number;
    title: string;
    description: string;
    module_order: number;
    content_raw?: string;
    file?: File | null;
    numLessonsToGenerate?: number;
    lessons: {
      id?: number;
      title: string;
      content_raw: string;
      lesson_script: string;
      lesson_order: number;
      originalScript?: string;
      quizzes?: {
        numQuestions: number;
        questionType: 'mcq' | 'true_false';
        questions: QuizQuestion[];
      };
      flashcards?: Flashcard[];
      isGeneratingQuiz?: boolean;
      isGeneratingFlashcards?: boolean;
    }[];
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState<{[key: number]: boolean}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moduleFileInputRefs = useRef<{[key: number]: HTMLInputElement | null}>({});

  // Add a module when the component mounts if there are none
  useEffect(() => {
    if (modules.length === 0) {
      handleAddModule();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // Ensure price is a valid number
      const price = parseFloat(value);
      if (!isNaN(price) && price >= 0) {
        setCourseData(prev => ({ ...prev, [name]: price }));
      }
    } else {
      setCourseData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to a storage service
      // For now, we'll use a placeholder image
      setCourseData(prev => ({
        ...prev,
        image_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }));
    }
  };

  const handleAddModule = () => {
    setModules(prev => [
      ...prev, 
      {
        title: '',
        description: '',
        module_order: prev.length + 1,
        content_raw: '',
        file: null,
        numLessonsToGenerate: 1,
        lessons: []
      }
    ]);
  };

  const handleModuleChange = (index: number, field: string, value: string | number | File | null) => {
    const updatedModules = [...modules];
    
    if (field === 'file' && value instanceof File) {
      updatedModules[index] = {
        ...updatedModules[index],
        file: value
      };
      
      // Parse the file content
      handleParseDocument(index, value);
    } else {
      updatedModules[index] = {
        ...updatedModules[index],
        [field]: value
      };
    }
    
    setModules(updatedModules);
  };

  const handleParseDocument = async (moduleIndex: number, file: File) => {
    try {
      setError(null);
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the session token
      const { data: { session } } = await CourseService.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }
      
      // Call the parse-document-content function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse document');
      }
      
      const data = await response.json();
      
      // Update the module's content_raw with the parsed content
      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        content_raw: data.content
      };
      setModules(updatedModules);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse document');
      console.error('Error parsing document:', err);
    }
  };

  const handleDeleteModule = (index: number) => {
    if (modules.length <= 1) {
      setError('At least one module is required');
      return;
    }
    
    if (confirm('Are you sure you want to delete this module? All lessons within it will be deleted as well.')) {
      const updatedModules = [...modules];
      updatedModules.splice(index, 1);
      
      // Reorder remaining modules
      updatedModules.forEach((module, i) => {
        module.module_order = i + 1;
      });
      
      setModules(updatedModules);
      
      // Update current module if needed
      if (currentModule >= updatedModules.length) {
        setCurrentModule(Math.max(0, updatedModules.length - 1));
        setCurrentLesson(0);
      }
    }
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === modules.length - 1)) {
      return;
    }
    
    const updatedModules = [...modules];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap modules
    [updatedModules[index], updatedModules[newIndex]] = [updatedModules[newIndex], updatedModules[index]];
    
    // Update module_order
    updatedModules.forEach((module, i) => {
      module.module_order = i + 1;
    });
    
    setModules(updatedModules);
    
    // Update current module if needed
    if (currentModule === index) {
      setCurrentModule(newIndex);
    } else if (currentModule === newIndex) {
      setCurrentModule(index);
    }
  };

  const handleAddLesson = (moduleIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push({
      title: '',
      content_raw: '',
      lesson_script: '',
      lesson_order: updatedModules[moduleIndex].lessons.length + 1
    });
    setModules(updatedModules);
    setCurrentModule(moduleIndex);
    setCurrentLesson(updatedModules[moduleIndex].lessons.length - 1);
  };

  const handleLessonChange = (
    moduleIndex: number, 
    lessonIndex: number, 
    field: string, 
    value: string | QuizQuestion[] | Flashcard[]
  ) => {
    const updatedModules = [...modules];
    
    if (field === 'quizzes.questions') {
      // Update quiz questions
      updatedModules[moduleIndex].lessons[lessonIndex].quizzes = {
        ...updatedModules[moduleIndex].lessons[lessonIndex].quizzes || {
          numQuestions: 5,
          questionType: 'mcq' as 'mcq' | 'true_false',
          questions: []
        },
        questions: value as QuizQuestion[]
      };
    } else if (field === 'flashcards') {
      // Update flashcards
      updatedModules[moduleIndex].lessons[lessonIndex].flashcards = value as Flashcard[];
    } else {
      // Update regular fields
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        [field]: value
      };
      
      // If updating lesson_script, save the original script if not already saved
      if (field === 'lesson_script' && !updatedModules[moduleIndex].lessons[lessonIndex].originalScript) {
        updatedModules[moduleIndex].lessons[lessonIndex].originalScript = value as string;
      }
    }
    
    setModules(updatedModules);
  };

  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    if (modules[moduleIndex].lessons.length <= 1) {
      setError('At least one lesson is required per module');
      return;
    }
    
    if (confirm('Are you sure you want to delete this lesson?')) {
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons.splice(lessonIndex, 1);
      
      // Reorder remaining lessons
      updatedModules[moduleIndex].lessons.forEach((lesson, i) => {
        lesson.lesson_order = i + 1;
      });
      
      setModules(updatedModules);
      
      // Update current lesson if needed
      if (currentLesson >= updatedModules[moduleIndex].lessons.length) {
        setCurrentLesson(Math.max(0, updatedModules[moduleIndex].lessons.length - 1));
      }
    }
  };

  const handleMoveLesson = (moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && lessonIndex === 0) || 
        (direction === 'down' && lessonIndex === modules[moduleIndex].lessons.length - 1)) {
      return;
    }
    
    const updatedModules = [...modules];
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    
    // Swap lessons
    [updatedModules[moduleIndex].lessons[lessonIndex], updatedModules[moduleIndex].lessons[newIndex]] = 
    [updatedModules[moduleIndex].lessons[newIndex], updatedModules[moduleIndex].lessons[lessonIndex]];
    
    // Update lesson_order
    updatedModules[moduleIndex].lessons.forEach((lesson, i) => {
      lesson.lesson_order = i + 1;
    });
    
    setModules(updatedModules);
    
    // Update current lesson if needed
    if (currentLesson === lessonIndex) {
      setCurrentLesson(newIndex);
    } else if (currentLesson === newIndex) {
      setCurrentLesson(lessonIndex);
    }
  };

  const handleGenerateLessonScript = async (moduleIndex: number, lessonIndex: number) => {
    try {
      setError(null);
      
      const lesson = modules[moduleIndex].lessons[lessonIndex];
      if (!lesson.content_raw) {
        setError('Lesson content is required to generate a script');
        return;
      }
      
      // Update UI to show loading state
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        isGeneratingScript: true
      };
      setModules(updatedModules);
      
      // Call the API to generate the lesson script
      const lessonScript = await CourseService.generateLessonScript(lesson.content_raw);
      
      // Update the lesson with the generated script
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        lesson_script: lessonScript,
        originalScript: lessonScript,
        isGeneratingScript: false
      };
      
      setModules(updatedModules);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lesson script');
      
      // Reset loading state
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        isGeneratingScript: false
      };
      setModules(updatedModules);
    }
  };

  const handleRevertToOriginalScript = (moduleIndex: number, lessonIndex: number) => {
    const originalScript = modules[moduleIndex].lessons[lessonIndex].originalScript;
    if (originalScript) {
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex].lesson_script = originalScript;
      setModules(updatedModules);
    }
  };

  const handleGenerateAndDistributeLessons = async (moduleIndex: number) => {
    try {
      setError(null);
      const module = modules[moduleIndex];
      
      if (!module.content_raw) {
        setError('Module content is required to generate lessons');
        return;
      }
      
      const numLessons = module.numLessonsToGenerate || 1;
      if (numLessons < 1 || numLessons > 5) {
        setError('Number of lessons must be between 1 and 5');
        return;
      }
      
      // Set loading state
      setIsGeneratingLessons(prev => ({...prev, [moduleIndex]: true}));
      
      // Split content into roughly equal parts
      const content = module.content_raw;
      const contentParts: string[] = [];
      
      if (numLessons === 1) {
        contentParts.push(content);
      } else {
        // Split by paragraphs first
        const paragraphs = content.split(/\n\n+/);
        
        if (paragraphs.length <= numLessons) {
          // Not enough paragraphs, so just distribute them
          for (let i = 0; i < numLessons; i++) {
            contentParts.push(paragraphs[i] || '');
          }
        } else {
          // Calculate paragraphs per lesson
          const paragraphsPerLesson = Math.floor(paragraphs.length / numLessons);
          
          for (let i = 0; i < numLessons; i++) {
            const startIdx = i * paragraphsPerLesson;
            const endIdx = (i === numLessons - 1) ? paragraphs.length : (i + 1) * paragraphsPerLesson;
            contentParts.push(paragraphs.slice(startIdx, endIdx).join('\n\n'));
          }
        }
      }
      
      // Generate lesson scripts for each part
      const lessonPromises = contentParts.map(async (part, index) => {
        try {
          const lessonScript = await CourseService.generateLessonScript(part);
          
          // Extract a title from the script
          const titleMatch = lessonScript.match(/^#\s+(.+)$/m) || lessonScript.match(/^##\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : `Lesson ${index + 1}`;
          
          return {
            title,
            content_raw: part,
            lesson_script: lessonScript,
            originalScript: lessonScript,
            lesson_order: index + 1
          };
        } catch (err) {
          console.error(`Error generating lesson ${index + 1}:`, err);
          return {
            title: `Lesson ${index + 1}`,
            content_raw: part,
            lesson_script: part,
            lesson_order: index + 1
          };
        }
      });
      
      const generatedLessons = await Promise.all(lessonPromises);
      
      // Update the module with the generated lessons
      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: generatedLessons
      };
      
      setModules(updatedModules);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lessons');
    } finally {
      setIsGeneratingLessons(prev => ({...prev, [moduleIndex]: false}));
    }
  };

  const handleGenerateQuiz = async (moduleIndex: number, lessonIndex: number) => {
    try {
      setError(null);
      
      const lesson = modules[moduleIndex].lessons[lessonIndex];
      if (!lesson.lesson_script) {
        setError('Lesson script is required to generate a quiz');
        return;
      }
      
      // Get quiz settings
      const numQuestions = lesson.quizzes?.numQuestions || 5;
      const questionType = lesson.quizzes?.questionType || 'mcq';
      
      // Update UI to show loading state
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        isGeneratingQuiz: true,
        quizzes: {
          ...updatedModules[moduleIndex].lessons[lessonIndex].quizzes || {
            numQuestions,
            questionType,
            questions: []
          }
        }
      };
      setModules(updatedModules);
      
      // Call the API to generate the quiz
      const quizData = await CourseService.generateQuiz(
        lesson.lesson_script,
        numQuestions,
        questionType
      );
      
      // Update the lesson with the generated quiz
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        quizzes: {
          numQuestions,
          questionType,
          questions: quizData.questions
        },
        isGeneratingQuiz: false
      };
      
      setModules(updatedModules);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      
      // Reset loading state
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        isGeneratingQuiz: false
      };
      setModules(updatedModules);
    }
  };

  const handleSaveQuiz = async (moduleIndex: number, lessonIndex: number) => {
    try {
      setError(null);
      
      const lesson = modules[moduleIndex].lessons[lessonIndex];
      if (!lesson.id || !lesson.quizzes?.questions?.length) {
        setError('Lesson must be saved and quiz questions must be generated before saving the quiz');
        return;
      }
      
      // Save the quiz
      await CourseService.saveLessonQuiz(lesson.id, lesson.quizzes.questions);
      
      alert('Quiz saved successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    }
  };

  const handleGenerateFlashcards = async (moduleIndex: number, lessonIndex: number) => {
    try {
      setError(null);
      
      const lesson = modules[moduleIndex].lessons[lessonIndex];
      if (!lesson.lesson_script) {
        setError('Lesson script is required to generate flashcards');
        return;
      }
      
      // Update UI to show loading state
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        isGeneratingFlashcards: true
      };
      setModules(updatedModules);
      
      // Call the API to generate the flashcards
      const numCards = 5; // Default number of flashcards
      const flashcardsData = await CourseService.generateLessonFlashcards(
        lesson.id || 0, // If lesson.id is undefined, use 0 (will be replaced with actual ID after saving)
        numCards
      );
      
      // Update the lesson with the generated flashcards
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        flashcards: flashcardsData.flashcards,
        isGeneratingFlashcards: false
      };
      
      setModules(updatedModules);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
      
      // Reset loading state
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex] = {
        ...updatedModules[moduleIndex].lessons[lessonIndex],
        isGeneratingFlashcards: false
      };
      setModules(updatedModules);
    }
  };

  const handleSaveFlashcards = async (moduleIndex: number, lessonIndex: number) => {
    try {
      setError(null);
      
      const lesson = modules[moduleIndex].lessons[lessonIndex];
      if (!lesson.id || !lesson.flashcards?.length) {
        setError('Lesson must be saved and flashcards must be generated before saving');
        return;
      }
      
      // Save the flashcards
      await CourseService.saveLessonFlashcards(lesson.id, lesson.flashcards);
      
      alert('Flashcards saved successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flashcards');
    }
  };

  const handleAddFlashcard = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    const currentFlashcards = updatedModules[moduleIndex].lessons[lessonIndex].flashcards || [];
    
    updatedModules[moduleIndex].lessons[lessonIndex].flashcards = [
      ...currentFlashcards,
      {
        id: uuidv4(),
        front: '',
        back: ''
      }
    ];
    
    setModules(updatedModules);
  };

  const handleUpdateFlashcard = (
    moduleIndex: number, 
    lessonIndex: number, 
    flashcardIndex: number, 
    field: 'front' | 'back', 
    value: string
  ) => {
    const updatedModules = [...modules];
    const flashcards = [...(updatedModules[moduleIndex].lessons[lessonIndex].flashcards || [])];
    
    flashcards[flashcardIndex] = {
      ...flashcards[flashcardIndex],
      [field]: value
    };
    
    updatedModules[moduleIndex].lessons[lessonIndex].flashcards = flashcards;
    setModules(updatedModules);
  };

  const handleDeleteFlashcard = (moduleIndex: number, lessonIndex: number, flashcardIndex: number) => {
    const updatedModules = [...modules];
    const flashcards = [...(updatedModules[moduleIndex].lessons[lessonIndex].flashcards || [])];
    
    flashcards.splice(flashcardIndex, 1);
    
    updatedModules[moduleIndex].lessons[lessonIndex].flashcards = flashcards;
    setModules(updatedModules);
  };

  const handleUpdateQuizSettings = (
    moduleIndex: number, 
    lessonIndex: number, 
    field: 'numQuestions' | 'questionType', 
    value: number | string
  ) => {
    const updatedModules = [...modules];
    const quizzes = updatedModules[moduleIndex].lessons[lessonIndex].quizzes || {
      numQuestions: 5,
      questionType: 'mcq' as 'mcq' | 'true_false',
      questions: []
    };
    
    if (field === 'numQuestions') {
      quizzes.numQuestions = value as number;
    } else if (field === 'questionType') {
      quizzes.questionType = value as 'mcq' | 'true_false';
    }
    
    updatedModules[moduleIndex].lessons[lessonIndex].quizzes = quizzes;
    setModules(updatedModules);
  };

  const handleUpdateQuizQuestion = (
    moduleIndex: number, 
    lessonIndex: number, 
    questionIndex: number, 
    field: keyof QuizQuestion, 
    value: string | string[] | number
  ) => {
    const updatedModules = [...modules];
    const quizzes = updatedModules[moduleIndex].lessons[lessonIndex].quizzes;
    
    if (!quizzes || !quizzes.questions) return;
    
    const questions = [...quizzes.questions];
    
    if (field === 'options' && Array.isArray(value)) {
      questions[questionIndex] = {
        ...questions[questionIndex],
        options: value
      };
    } else {
      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value
      };
    }
    
    updatedModules[moduleIndex].lessons[lessonIndex].quizzes = {
      ...quizzes,
      questions
    };
    
    setModules(updatedModules);
  };

  const handleUpdateQuizOption = (
    moduleIndex: number, 
    lessonIndex: number, 
    questionIndex: number, 
    optionIndex: number, 
    value: string
  ) => {
    const updatedModules = [...modules];
    const quizzes = updatedModules[moduleIndex].lessons[lessonIndex].quizzes;
    
    if (!quizzes || !quizzes.questions) return;
    
    const questions = [...quizzes.questions];
    const options = [...questions[questionIndex].options];
    
    options[optionIndex] = value;
    
    questions[questionIndex] = {
      ...questions[questionIndex],
      options
    };
    
    updatedModules[moduleIndex].lessons[lessonIndex].quizzes = {
      ...quizzes,
      questions
    };
    
    setModules(updatedModules);
  };

  const handleAddQuizQuestion = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    const quizzes = updatedModules[moduleIndex].lessons[lessonIndex].quizzes || {
      numQuestions: 5,
      questionType: 'mcq' as 'mcq' | 'true_false',
      questions: []
    };
    
    const questionType = quizzes.questionType;
    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      question: '',
      type: questionType,
      options: questionType === 'mcq' 
        ? ['', '', '', ''] 
        : ['True', 'False'],
      correct_answer: 0
    };
    
    updatedModules[moduleIndex].lessons[lessonIndex].quizzes = {
      ...quizzes,
      questions: [...quizzes.questions, newQuestion]
    };
    
    setModules(updatedModules);
  };

  const handleDeleteQuizQuestion = (moduleIndex: number, lessonIndex: number, questionIndex: number) => {
    const updatedModules = [...modules];
    const quizzes = updatedModules[moduleIndex].lessons[lessonIndex].quizzes;
    
    if (!quizzes || !quizzes.questions) return;
    
    const questions = [...quizzes.questions];
    questions.splice(questionIndex, 1);
    
    updatedModules[moduleIndex].lessons[lessonIndex].quizzes = {
      ...quizzes,
      questions
    };
    
    setModules(updatedModules);
  };

  const handleGenerateRandomData = () => {
    setCourseData({
      title: 'Complete Web Development Bootcamp',
      description: 'Learn web development from scratch with this comprehensive bootcamp. From HTML and CSS to advanced JavaScript frameworks, this course covers everything you need to become a full-stack developer.',
      price: 49.99,
      category: 'technology',
      difficulty: 'intermediate',
      image_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    });

    setModules([
      {
        title: 'HTML & CSS Fundamentals',
        description: 'Learn the building blocks of web development with HTML and CSS',
        module_order: 1,
        content_raw: `HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It defines the structure and content of web pages. CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in HTML. Together, they form the foundation of web development.

In this module, we'll cover HTML elements, attributes, document structure, and semantic markup. We'll also explore CSS selectors, properties, the box model, layout techniques, and responsive design principles. By the end of this module, you'll be able to create well-structured, visually appealing web pages.

Topics include:
- HTML document structure
- HTML elements and attributes
- Semantic HTML
- CSS selectors and specificity
- CSS box model
- Flexbox and Grid layout
- Responsive design with media queries
- CSS variables and custom properties`,
        numLessonsToGenerate: 2,
        lessons: [
          {
            title: 'Introduction to HTML',
            content_raw: 'HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. This lesson covers the basics of HTML structure, elements, and attributes.',
            lesson_script: `# Introduction to HTML

## What is HTML?

HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It defines the structure and content of web pages, telling browsers how to display text, images, and other media.

HTML is not a programming language; it's a markup language that uses tags to define elements within a document. These elements form the building blocks of all websites.

## HTML Document Structure

Every HTML document follows a standard structure:

<pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;Page Title&lt;/title&gt;
    &lt;meta charset="UTF-8"&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;!-- Content goes here --&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

- **&lt;!DOCTYPE html&gt;**: Declares the document type and version of HTML
- **&lt;html&gt;**: The root element that contains all other HTML elements
- **&lt;head&gt;**: Contains meta-information about the document
- **&lt;title&gt;**: Specifies the title of the document (shown in browser tabs)
- **&lt;body&gt;**: Contains the visible content of the page

## HTML Elements and Attributes

HTML elements are defined by tags, which typically come in pairs:

<pre><code>&lt;tagname&gt;Content goes here...&lt;/tagname&gt;</code></pre>

For example:
<pre><code>&lt;h1&gt;This is a heading&lt;/h1&gt;
&lt;p&gt;This is a paragraph.&lt;/p&gt;</code></pre>

HTML elements can also have attributes that provide additional information:

<pre><code>&lt;tagname attribute="value"&gt;Content&lt;/tagname&gt;</code></pre>

For example:
<pre><code>&lt;a href="https://www.example.com"&gt;Visit Example.com&lt;/a&gt;</code></pre>

## Common HTML Elements

### Headings
HTML offers six levels of headings:

<pre><code>&lt;h1&gt;Heading 1&lt;/h1&gt;
&lt;h2&gt;Heading 2&lt;/h2&gt;
&lt;h3&gt;Heading 3&lt;/h3&gt;
&lt;h4&gt;Heading 4&lt;/h4&gt;
&lt;h5&gt;Heading 5&lt;/h5&gt;
&lt;h6&gt;Heading 6&lt;/h6&gt;</code></pre>

### Paragraphs
<pre><code>&lt;p&gt;This is a paragraph.&lt;/p&gt;</code></pre>

### Links
<pre><code>&lt;a href="url"&gt;Link text&lt;/a&gt;</code></pre>

### Images
<pre><code>&lt;img src="image.jpg" alt="Description of image"&gt;</code></pre>

### Lists
Unordered list:
<pre><code>&lt;ul&gt;
    &lt;li&gt;Item 1&lt;/li&gt;
    &lt;li&gt;Item 2&lt;/li&gt;
&lt;/ul&gt;</code></pre>

Ordered list:
<pre><code>&lt;ol&gt;
    &lt;li&gt;First item&lt;/li&gt;
    &lt;li&gt;Second item&lt;/li&gt;
&lt;/ol&gt;</code></pre>

## Semantic HTML

Semantic HTML uses tags that convey meaning about the content they contain, making web pages more accessible and SEO-friendly:

<pre><code>&lt;header&gt;Site or section header&lt;/header&gt;
&lt;nav&gt;Navigation links&lt;/nav&gt;
&lt;main&gt;Main content&lt;/main&gt;
&lt;article&gt;Independent, self-contained content&lt;/article&gt;
&lt;section&gt;Thematic grouping of content&lt;/section&gt;
&lt;aside&gt;Sidebar content&lt;/aside&gt;
&lt;footer&gt;Site or section footer&lt;/footer&gt;</code></pre>

## Summary

HTML provides the structure and content for web pages. Understanding HTML elements, attributes, and document structure is essential for web development. In the next lesson, we'll explore CSS and how it works with HTML to create visually appealing websites.`,
            lesson_order: 1,
            originalScript: `# Introduction to HTML

## What is HTML?

HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It defines the structure and content of web pages, telling browsers how to display text, images, and other media.

HTML is not a programming language; it's a markup language that uses tags to define elements within a document. These elements form the building blocks of all websites.

## HTML Document Structure

Every HTML document follows a standard structure:

<pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;Page Title&lt;/title&gt;
    &lt;meta charset="UTF-8"&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;!-- Content goes here --&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

- **&lt;!DOCTYPE html&gt;**: Declares the document type and version of HTML
- **&lt;html&gt;**: The root element that contains all other HTML elements
- **&lt;head&gt;**: Contains meta-information about the document
- **&lt;title&gt;**: Specifies the title of the document (shown in browser tabs)
- **&lt;body&gt;**: Contains the visible content of the page

## HTML Elements and Attributes

HTML elements are defined by tags, which typically come in pairs:

<pre><code>&lt;tagname&gt;Content goes here...&lt;/tagname&gt;</code></pre>

For example:
<pre><code>&lt;h1&gt;This is a heading&lt;/h1&gt;
&lt;p&gt;This is a paragraph.&lt;/p&gt;</code></pre>

HTML elements can also have attributes that provide additional information:

<pre><code>&lt;tagname attribute="value"&gt;Content&lt;/tagname&gt;</code></pre>

For example:
<pre><code>&lt;a href="https://www.example.com"&gt;Visit Example.com&lt;/a&gt;</code></pre>

## Common HTML Elements

### Headings
HTML offers six levels of headings:

<pre><code>&lt;h1&gt;Heading 1&lt;/h1&gt;
&lt;h2&gt;Heading 2&lt;/h2&gt;
&lt;h3&gt;Heading 3&lt;/h3&gt;
&lt;h4&gt;Heading 4&lt;/h4&gt;
&lt;h5&gt;Heading 5&lt;/h5&gt;
&lt;h6&gt;Heading 6&lt;/h6&gt;</code></pre>

### Paragraphs
<pre><code>&lt;p&gt;This is a paragraph.&lt;/p&gt;</code></pre>

### Links
<pre><code>&lt;a href="url"&gt;Link text&lt;/a&gt;</code></pre>

### Images
<pre><code>&lt;img src="image.jpg" alt="Description of image"&gt;</code></pre>

### Lists
Unordered list:
<pre><code>&lt;ul&gt;
    &lt;li&gt;Item 1&lt;/li&gt;
    &lt;li&gt;Item 2&lt;/li&gt;
&lt;/ul&gt;</code></pre>

Ordered list:
<pre><code>&lt;ol&gt;
    &lt;li&gt;First item&lt;/li&gt;
    &lt;li&gt;Second item&lt;/li&gt;
&lt;/ol&gt;</code></pre>

## Semantic HTML

Semantic HTML uses tags that convey meaning about the content they contain, making web pages more accessible and SEO-friendly:

<pre><code>&lt;header&gt;Site or section header&lt;/header&gt;
&lt;nav&gt;Navigation links&lt;/nav&gt;
&lt;main&gt;Main content&lt;/main&gt;
&lt;article&gt;Independent, self-contained content&lt;/article&gt;
&lt;section&gt;Thematic grouping of content&lt;/section&gt;
&lt;aside&gt;Sidebar content&lt;/aside&gt;
&lt;footer&gt;Site or section footer&lt;/footer&gt;</code></pre>

## Summary

HTML provides the structure and content for web pages. Understanding HTML elements, attributes, and document structure is essential for web development. In the next lesson, we'll explore CSS and how it works with HTML to create visually appealing websites.`
          },
          {
            title: 'CSS Basics',
            content_raw: 'Cascading Style Sheets (CSS) is a style sheet language used for describing the presentation of a document written in HTML. This lesson covers selectors, properties, and values.',
            lesson_script: `# CSS Basics

## Introduction to CSS

CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in HTML. While HTML provides the structure and content of a web page, CSS controls how that content looks and is laid out.

With CSS, you can control colors, fonts, spacing, layout, animations, and more. It allows you to separate content from presentation, making your code more maintainable and enabling you to apply consistent styling across multiple pages.

## How CSS Works

CSS works by selecting HTML elements and applying styles to them. The basic syntax looks like this:

<pre><code>selector {
  property: value;
  another-property: another-value;
}</code></pre>

For example:

<pre><code>h1 {
  color: blue;
  font-size: 24px;
}</code></pre>

This code selects all h1 elements and makes their text blue with a font size of 24 pixels.

## Adding CSS to HTML

There are three ways to add CSS to an HTML document:

### 1. Inline CSS
Added directly to HTML elements using the style attribute:

<pre><code>&lt;h1 style="color: blue; font-size: 24px;"&gt;This is a heading&lt;/h1&gt;</code></pre>

### 2. Internal CSS
Added within a style element in the document's head section:

<pre><code>&lt;head&gt;
  &lt;style&gt;
    h1 {
      color: blue;
      font-size: 24px;
    }
  &lt;/style&gt;
&lt;/head&gt;</code></pre>

### 3. External CSS
Linked from an external CSS file:

<pre><code>&lt;head&gt;
  &lt;link rel="stylesheet" href="styles.css"&gt;
&lt;/head&gt;</code></pre>

External CSS is generally the preferred method for larger projects as it keeps your HTML clean and allows for reusing styles across multiple pages.

## CSS Selectors

Selectors determine which HTML elements the styles will be applied to:

### Element Selector
Selects all elements of a specified type:

<pre><code>p {
  color: gray;
}</code></pre>

### Class Selector
Selects elements with a specific class attribute:

<pre><code>.highlight {
  background-color: yellow;
}</code></pre>

In HTML: <code>&lt;p class="highlight"&gt;This text is highlighted&lt;/p&gt;</code>

### ID Selector
Selects a single element with a specific ID:

<pre><code>#header {
  background-color: black;
  color: white;
}</code></pre>

In HTML: <code>&lt;div id="header"&gt;Header content&lt;/div&gt;</code>

### Combination Selectors
You can combine selectors for more specific targeting:

<pre><code>/* Descendant selector - targets paragraphs inside articles */
article p {
  font-style: italic;
}

/* Child selector - targets direct children */
ul > li {
  list-style-type: square;
}

/* Adjacent sibling selector */
h2 + p {
  font-weight: bold;
}</code></pre>

## Common CSS Properties

### Text Styling
<pre><code>p {
  color: #333333;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  line-height: 1.5;
  text-decoration: underline;
}</code></pre>

### Box Model Properties
<pre><code>div {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 1px solid black;
  margin: 10px;
}</code></pre>

### Background Properties
<pre><code>body {
  background-color: #f0f0f0;
  background-image: url('background.jpg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}</code></pre>

## The CSS Box Model

Every HTML element is treated as a box with the following properties:

- **Content**: The actual content of the element
- **Padding**: Space between the content and the border
- **Border**: A line around the padding
- **Margin**: Space outside the border

<pre><code>div {
  /* Content dimensions */
  width: 300px;
  height: 200px;
  
  /* Padding */
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 10px;
  padding-left: 20px;
  /* Shorthand: padding: 10px 20px; (top/bottom, left/right) */
  
  /* Border */
  border-width: 1px;
  border-style: solid;
  border-color: black;
  /* Shorthand: border: 1px solid black; */
  
  /* Margin */
  margin-top: 10px;
  margin-right: 15px;
  margin-bottom: 10px;
  margin-left: 15px;
  /* Shorthand: margin: 10px 15px; (top/bottom, left/right) */
}</code></pre>

## CSS Specificity and the Cascade

When multiple conflicting CSS rules target the same element, the browser uses specificity to determine which rule to apply:

1. Inline styles (highest specificity)
2. IDs
3. Classes, attributes, and pseudo-classes
4. Elements and pseudo-elements (lowest specificity)

If two selectors have the same specificity, the one that comes later in the CSS will be applied.

## Summary

CSS is a powerful language for styling web pages. By understanding selectors, properties, and the box model, you can create visually appealing and responsive designs. As you continue learning, you'll discover more advanced CSS techniques like flexbox, grid, and animations that will give you even more control over your web page layouts.`,
            lesson_order: 2,
            originalScript: `# CSS Basics

## Introduction to CSS

CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in HTML. While HTML provides the structure and content of a web page, CSS controls how that content looks and is laid out.

With CSS, you can control colors, fonts, spacing, layout, animations, and more. It allows you to separate content from presentation, making your code more maintainable and enabling you to apply consistent styling across multiple pages.

## How CSS Works

CSS works by selecting HTML elements and applying styles to them. The basic syntax looks like this:

<pre><code>selector {
  property: value;
  another-property: another-value;
}</code></pre>

For example:

<pre><code>h1 {
  color: blue;
  font-size: 24px;
}</code></pre>

This code selects all h1 elements and makes their text blue with a font size of 24 pixels.

## Adding CSS to HTML

There are three ways to add CSS to an HTML document:

### 1. Inline CSS
Added directly to HTML elements using the style attribute:

<pre><code>&lt;h1 style="color: blue; font-size: 24px;"&gt;This is a heading&lt;/h1&gt;</code></pre>

### 2. Internal CSS
Added within a style element in the document's head section:

<pre><code>&lt;head&gt;
  &lt;style&gt;
    h1 {
      color: blue;
      font-size: 24px;
    }
  &lt;/style&gt;
&lt;/head&gt;</code></pre>

### 3. External CSS
Linked from an external CSS file:

<pre><code>&lt;head&gt;
  &lt;link rel="stylesheet" href="styles.css"&gt;
&lt;/head&gt;</code></pre>

External CSS is generally the preferred method for larger projects as it keeps your HTML clean and allows for reusing styles across multiple pages.

## CSS Selectors

Selectors determine which HTML elements the styles will be applied to:

### Element Selector
Selects all elements of a specified type:

<pre><code>p {
  color: gray;
}</code></pre>

### Class Selector
Selects elements with a specific class attribute:

<pre><code>.highlight {
  background-color: yellow;
}</code></pre>

In HTML: <code>&lt;p class="highlight"&gt;This text is highlighted&lt;/p&gt;</code>

### ID Selector
Selects a single element with a specific ID:

<pre><code>#header {
  background-color: black;
  color: white;
}</code></pre>

In HTML: <code>&lt;div id="header"&gt;Header content&lt;/div&gt;</code>

### Combination Selectors
You can combine selectors for more specific targeting:

<pre><code>/* Descendant selector - targets paragraphs inside articles */
article p {
  font-style: italic;
}

/* Child selector - targets direct children */
ul > li {
  list-style-type: square;
}

/* Adjacent sibling selector */
h2 + p {
  font-weight: bold;
}</code></pre>

## Common CSS Properties

### Text Styling
<pre><code>p {
  color: #333333;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  line-height: 1.5;
  text-decoration: underline;
}</code></pre>

### Box Model Properties
<pre><code>div {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 1px solid black;
  margin: 10px;
}</code></pre>

### Background Properties
<pre><code>body {
  background-color: #f0f0f0;
  background-image: url('background.jpg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}</code></pre>

## The CSS Box Model

Every HTML element is treated as a box with the following properties:

- **Content**: The actual content of the element
- **Padding**: Space between the content and the border
- **Border**: A line around the padding
- **Margin**: Space outside the border

<pre><code>div {
  /* Content dimensions */
  width: 300px;
  height: 200px;
  
  /* Padding */
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 10px;
  padding-left: 20px;
  /* Shorthand: padding: 10px 20px; (top/bottom, left/right) */
  
  /* Border */
  border-width: 1px;
  border-style: solid;
  border-color: black;
  /* Shorthand: border: 1px solid black; */
  
  /* Margin */
  margin-top: 10px;
  margin-right: 15px;
  margin-bottom: 10px;
  margin-left: 15px;
  /* Shorthand: margin: 10px 15px; (top/bottom, left/right) */
}</code></pre>

## CSS Specificity and the Cascade

When multiple conflicting CSS rules target the same element, the browser uses specificity to determine which rule to apply:

1. Inline styles (highest specificity)
2. IDs
3. Classes, attributes, and pseudo-classes
4. Elements and pseudo-elements (lowest specificity)

If two selectors have the same specificity, the one that comes later in the CSS will be applied.

## Summary

CSS is a powerful language for styling web pages. By understanding selectors, properties, and the box model, you can create visually appealing and responsive designs. As you continue learning, you'll discover more advanced CSS techniques like flexbox, grid, and animations that will give you even more control over your web page layouts.`
          }
        ]
      },
      {
        title: 'JavaScript Essentials',
        description: 'Master the fundamentals of JavaScript programming',
        module_order: 2,
        content_raw: `JavaScript is a versatile programming language primarily used for creating interactive effects within web browsers. It's a core technology of the World Wide Web alongside HTML and CSS. JavaScript enables dynamic content, controls multimedia, animates images, and pretty much everything else.

In this module, we'll cover JavaScript syntax, data types, operators, control structures, functions, and DOM manipulation. We'll also explore modern JavaScript features like arrow functions, template literals, destructuring, and modules. By the end of this module, you'll be able to write JavaScript code to create interactive web applications.

Topics include:
- JavaScript syntax and data types
- Variables, operators, and expressions
- Control flow (conditionals and loops)
- Functions and scope
- Arrays and objects
- DOM manipulation
- Events and event handling
- Modern JavaScript features (ES6+)`,
        numLessonsToGenerate: 2,
        lessons: [
          {
            title: 'JavaScript Syntax',
            content_raw: 'Learn the basic syntax of JavaScript including variables, data types, operators, and control structures.',
            lesson_script: `# JavaScript Syntax

## Introduction to JavaScript

JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. It was originally developed by Brendan Eich at Netscape in 1995. Today, JavaScript is one of the core technologies of the World Wide Web, alongside HTML and CSS.

Unlike HTML and CSS, JavaScript is a true programming language that allows you to create dynamic and interactive web content. It can update HTML and CSS, calculate, manipulate and validate data, control multimedia, animate images, and much more.

## JavaScript Basics

### Adding JavaScript to HTML

There are three ways to include JavaScript in an HTML document:

1. **Inline JavaScript**:
<pre><code>&lt;button onclick="alert('Hello, World!')"&gt;Click me&lt;/button&gt;</code></pre>

2. **Internal JavaScript** (using script tags):
<pre><code>&lt;script&gt;
  function sayHello() {
    alert('Hello, World!');
  }
&lt;/script&gt;</code></pre>

3. **External JavaScript** (recommended for larger scripts):
<pre><code>&lt;script src="script.js"&gt;&lt;/script&gt;</code></pre>

### JavaScript Syntax Rules

- JavaScript is case-sensitive (myVariable is different from myvariable)
- Statements end with semicolons (optional but recommended)
- Code blocks are enclosed in curly braces {}
- Comments can be single-line // or multi-line /* */

## Variables and Data Types

### Declaring Variables

In modern JavaScript, there are three ways to declare variables:

<pre><code>// Using let (block-scoped, can be reassigned)
let age = 25;

// Using const (block-scoped, cannot be reassigned)
const PI = 3.14159;

// Using var (function-scoped, older way)
var name = "John";</code></pre>

### Data Types

JavaScript has several built-in data types:

1. **Primitive Types**:
   - **Number**: Both integers and floating-point numbers
     <pre><code>let count = 42;
let price = 19.99;</code></pre>
   
   - **String**: Text enclosed in single or double quotes
     <pre><code>let firstName = "John";
let lastName = 'Doe';</code></pre>
   
   - **Boolean**: true or false
     <pre><code>let isActive = true;
let isCompleted = false;</code></pre>
   
   - **Undefined**: A variable that has been declared but not assigned a value
     <pre><code>let result;
console.log(result); // undefined</code></pre>
   
   - **Null**: Represents the intentional absence of any value
     <pre><code>let user = null;</code></pre>
   
   - **Symbol**: Unique and immutable primitive value (ES6)
     <pre><code>const uniqueId = Symbol('id');</code></pre>
   
   - **BigInt**: For integers larger than the Number type can handle (ES2020)
     <pre><code>const bigNumber = 9007199254740991n;</code></pre>

2. **Object Types**:
   - **Object**: Collection of key-value pairs
     <pre><code>const person = {
  firstName: "John",
  lastName: "Doe",
  age: 30
};</code></pre>
   
   - **Array**: Ordered collection of values
     <pre><code>const colors = ["red", "green", "blue"];</code></pre>
   
   - **Function**: Reusable block of code
     <pre><code>function greet(name) {
  return "Hello, " + name + "!";
}</code></pre>

### Type Checking

You can check the type of a variable using the typeof operator:

<pre><code>console.log(typeof 42); // "number"
console.log(typeof "Hello"); // "string"
console.log(typeof true); // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof null); // "object" (this is a known JavaScript bug)
console.log(typeof {}); // "object"
console.log(typeof []); // "object"
console.log(typeof function(){}); // "function"</code></pre>

## Operators

JavaScript supports various types of operators:

### Arithmetic Operators

<pre><code>let a = 10;
let b = 3;

console.log(a + b); // Addition: 13
console.log(a - b); // Subtraction: 7
console.log(a * b); // Multiplication: 30
console.log(a / b); // Division: 3.33...
console.log(a % b); // Modulus (remainder): 1
console.log(a ** b); // Exponentiation: 1000</code></pre>

### Assignment Operators

<pre><code>let x = 5; // Assign 5 to x
x += 3; // Same as x = x + 3
x -= 2; // Same as x = x - 2
x *= 4; // Same as x = x * 4
x /= 2; // Same as x = x / 2
x %= 3; // Same as x = x % 3</code></pre>

### Comparison Operators

<pre><code>console.log(5 == 5); // Equal to: true
console.log(5 === "5"); // Equal value and type: false
console.log(5 != 8); // Not equal to: true
console.log(5 !== "5"); // Not equal value or type: true
console.log(5 > 3); // Greater than: true
console.log(5 < 8); // Less than: true
console.log(5 >= 5); // Greater than or equal to: true
console.log(5 <= 4); // Less than or equal to: false</code></pre>

### Logical Operators

<pre><code>console.log(true && true); // Logical AND: true
console.log(true && false); // Logical AND: false
console.log(true || false); // Logical OR: true
console.log(!true); // Logical NOT: false</code></pre>

## Control Structures

### Conditional Statements

**if...else**:
<pre><code>let age = 18;

if (age >= 18) {
  console.log("You are an adult");
} else {
  console.log("You are a minor");
}</code></pre>

**if...else if...else**:
<pre><code>let score = 85;

if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 80) {
  console.log("Grade: B");
} else if (score >= 70) {
  console.log("Grade: C");
} else {
  console.log("Grade: F");
}</code></pre>

**switch statement**:
<pre><code>let day = 3;
let dayName;

switch (day) {
  case 1:
    dayName = "Monday";
    break;
  case 2:
    dayName = "Tuesday";
    break;
  case 3:
    dayName = "Wednesday";
    break;
  case 4:
    dayName = "Thursday";
    break;
  case 5:
    dayName = "Friday";
    break;
  case 6:
    dayName = "Saturday";
    break;
  case 7:
    dayName = "Sunday";
    break;
  default:
    dayName = "Invalid day";
}

console.log(dayName); // "Wednesday"</code></pre>

### Loops

**for loop**:
<pre><code>for (let i = 0; i < 5; i++) {
  console.log(i); // Outputs 0, 1, 2, 3, 4
}</code></pre>

**while loop**:
<pre><code>let i = 0;
while (i < 5) {
  console.log(i); // Outputs 0, 1, 2, 3, 4
  i++;
}</code></pre>

**do...while loop**:
<pre><code>let i = 0;
do {
  console.log(i); // Outputs 0, 1, 2, 3, 4
  i++;
} while (i < 5);</code></pre>

**for...of loop** (for iterating over arrays):
<pre><code>const colors = ["red", "green", "blue"];
for (const color of colors) {
  console.log(color); // Outputs "red", "green", "blue"
}</code></pre>

**for...in loop** (for iterating over object properties):
<pre><code>const person = {
  name: "John",
  age: 30,
  job: "Developer"
};

for (const key in person) {
  console.log(key + ": " + person[key]);
}
// Outputs:
// name: John
// age: 30
// job: Developer</code></pre>

## Summary

In this lesson, we've covered the fundamental syntax of JavaScript, including:

- How to add JavaScript to HTML
- Variables and data types
- Operators for arithmetic, assignment, comparison, and logical operations
- Control structures like conditionals and loops

Understanding these basics is essential for writing JavaScript code. In the next lesson, we'll explore functions, objects, and arrays in more detail, which are crucial for building more complex applications.`,
            lesson_order: 1,
            originalScript: `# JavaScript Syntax

## Introduction to JavaScript

JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. It was originally developed by Brendan Eich at Netscape in 1995. Today, JavaScript is one of the core technologies of the World Wide Web, alongside HTML and CSS.

Unlike HTML and CSS, JavaScript is a true programming language that allows you to create dynamic and interactive web content. It can update HTML and CSS, calculate, manipulate and validate data, control multimedia, animate images, and much more.

## JavaScript Basics

### Adding JavaScript to HTML

There are three ways to include JavaScript in an HTML document:

1. **Inline JavaScript**:
<pre><code>&lt;button onclick="alert('Hello, World!')"&gt;Click me&lt;/button&gt;</code></pre>

2. **Internal JavaScript** (using script tags):
<pre><code>&lt;script&gt;
  function sayHello() {
    alert('Hello, World!');
  }
&lt;/script&gt;</code></pre>

3. **External JavaScript** (recommended for larger scripts):
<pre><code>&lt;script src="script.js"&gt;&lt;/script&gt;</code></pre>

### JavaScript Syntax Rules

- JavaScript is case-sensitive (myVariable is different from myvariable)
- Statements end with semicolons (optional but recommended)
- Code blocks are enclosed in curly braces {}
- Comments can be single-line // or multi-line /* */

## Variables and Data Types

### Declaring Variables

In modern JavaScript, there are three ways to declare variables:

<pre><code>// Using let (block-scoped, can be reassigned)
let age = 25;

// Using const (block-scoped, cannot be reassigned)
const PI = 3.14159;

// Using var (function-scoped, older way)
var name = "John";</code></pre>

### Data Types

JavaScript has several built-in data types:

1. **Primitive Types**:
   - **Number**: Both integers and floating-point numbers
     <pre><code>let count = 42;
let price = 19.99;</code></pre>
   
   - **String**: Text enclosed in single or double quotes
     <pre><code>let firstName = "John";
let lastName = 'Doe';</code></pre>
   
   - **Boolean**: true or false
     <pre><code>let isActive = true;
let isCompleted = false;</code></pre>
   
   - **Undefined**: A variable that has been declared but not assigned a value
     <pre><code>let result;
console.log(result); // undefined</code></pre>
   
   - **Null**: Represents the intentional absence of any value
     <pre><code>let user = null;</code></pre>
   
   - **Symbol**: Unique and immutable primitive value (ES6)
     <pre><code>const uniqueId = Symbol('id');</code></pre>
   
   - **BigInt**: For integers larger than the Number type can handle (ES2020)
     <pre><code>const bigNumber = 9007199254740991n;</code></pre>

2. **Object Types**:
   - **Object**: Collection of key-value pairs
     <pre><code>const person = {
  firstName: "John",
  lastName: "Doe",
  age: 30
};</code></pre>
   
   - **Array**: Ordered collection of values
     <pre><code>const colors = ["red", "green", "blue"];</code></pre>
   
   - **Function**: Reusable block of code
     <pre><code>function greet(name) {
  return "Hello, " + name + "!";
}</code></pre>

### Type Checking

You can check the type of a variable using the typeof operator:

<pre><code>console.log(typeof 42); // "number"
console.log(typeof "Hello"); // "string"
console.log(typeof true); // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof null); // "object" (this is a known JavaScript bug)
console.log(typeof {}); // "object"
console.log(typeof []); // "object"
console.log(typeof function(){}); // "function"</code></pre>

## Operators

JavaScript supports various types of operators:

### Arithmetic Operators

<pre><code>let a = 10;
let b = 3;

console.log(a + b); // Addition: 13
console.log(a - b); // Subtraction: 7
console.log(a * b); // Multiplication: 30
console.log(a / b); // Division: 3.33...
console.log(a % b); // Modulus (remainder): 1
console.log(a ** b); // Exponentiation: 1000</code></pre>

### Assignment Operators

<pre><code>let x = 5; // Assign 5 to x
x += 3; // Same as x = x + 3
x -= 2; // Same as x = x - 2
x *= 4; // Same as x = x * 4
x /= 2; // Same as x = x / 2
x %= 3; // Same as x = x % 3</code></pre>

### Comparison Operators

<pre><code>console.log(5 == 5); // Equal to: true
console.log(5 === "5"); // Equal value and type: false
console.log(5 != 8); // Not equal to: true
console.log(5 !== "5"); // Not equal value or type: true
console.log(5 > 3); // Greater than: true
console.log(5 < 8); // Less than: true
console.log(5 >= 5); // Greater than or equal to: true
console.log(5 <= 4); // Less than or equal to: false</code></pre>

### Logical Operators

<pre><code>console.log(true && true); // Logical AND: true
console.log(true && false); // Logical AND: false
console.log(true || false); // Logical OR: true
console.log(!true); // Logical NOT: false</code></pre>

## Control Structures

### Conditional Statements

**if...else**:
<pre><code>let age = 18;

if (age >= 18) {
  console.log("You are an adult");
} else {
  console.log("You are a minor");
}</code></pre>

**if...else if...else**:
<pre><code>let score = 85;

if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 80) {
  console.log("Grade: B");
} else if (score >= 70) {
  console.log("Grade: C");
} else {
  console.log("Grade: F");
}</code></pre>

**switch statement**:
<pre><code>let day = 3;
let dayName;

switch (day) {
  case 1:
    dayName = "Monday";
    break;
  case 2:
    dayName = "Tuesday";
    break;
  case 3:
    dayName = "Wednesday";
    break;
  case 4:
    dayName = "Thursday";
    break;
  case 5:
    dayName = "Friday";
    break;
  case 6:
    dayName = "Saturday";
    break;
  case 7:
    dayName = "Sunday";
    break;
  default:
    dayName = "Invalid day";
}

console.log(dayName); // "Wednesday"</code></pre>

### Loops

**for loop**:
<pre><code>for (let i = 0; i < 5; i++) {
  console.log(i); // Outputs 0, 1, 2, 3, 4
}</code></pre>

**while loop**:
<pre><code>let i = 0;
while (i < 5) {
  console.log(i); // Outputs 0, 1, 2, 3, 4
  i++;
}</code></pre>

**do...while loop**:
<pre><code>let i = 0;
do {
  console.log(i); // Outputs 0, 1, 2, 3, 4
  i++;
} while (i < 5);</code></pre>

**for...of loop** (for iterating over arrays):
<pre><code>const colors = ["red", "green", "blue"];
for (const color of colors) {
  console.log(color); // Outputs "red", "green", "blue"
}</code></pre>

**for...in loop** (for iterating over object properties):
<pre><code>const person = {
  name: "John",
  age: 30,
  job: "Developer"
};

for (const key in person) {
  console.log(key + ": " + person[key]);
}
// Outputs:
// name: John
// age: 30
// job: Developer</code></pre>

## Summary

In this lesson, we've covered the fundamental syntax of JavaScript, including:

- How to add JavaScript to HTML
- Variables and data types
- Operators for arithmetic, assignment, comparison, and logical operations
- Control structures like conditionals and loops

Understanding these basics is essential for writing JavaScript code. In the next lesson, we'll explore functions, objects, and arrays in more detail, which are crucial for building more complex applications.`
          },
          {
            title: 'DOM Manipulation',
            content_raw: 'The Document Object Model (DOM) is a programming interface for web documents. Learn how to use JavaScript to manipulate the DOM.',
            lesson_script: `# DOM Manipulation

## Introduction to the DOM

The Document Object Model (DOM) is a programming interface for web documents. It represents the page so that programs can change the document structure, style, and content. The DOM represents the document as nodes and objects; this way, programming languages like JavaScript can interact with the page.

In simpler terms, the DOM is a tree-like representation of the contents of a webpage - a tree of "nodes" with different relationships depending on how they're arranged in the HTML document.

## The DOM Tree

When a web page is loaded, the browser creates a Document Object Model of the page. This model is structured like a tree:

- The **document** object is the root node
- Each HTML element becomes an element node
- Text within elements becomes text nodes
- Comments become comment nodes
- Attributes become attribute nodes

For example, consider this HTML:

<pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;My Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;Welcome&lt;/h1&gt;
  &lt;p&gt;This is my page.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

The DOM tree would look something like:

<pre><code>document
└── html
    ├── head
    │   └── title
    │       └── "My Page" (text node)
    └── body
        ├── h1
        │   └── "Welcome" (text node)
        └── p
            └── "This is my page." (text node)</code></pre>

## Accessing DOM Elements

JavaScript provides several methods to access elements in the DOM:

### By ID

<pre><code>const element = document.getElementById('myId');</code></pre>

### By Class Name

<pre><code>const elements = document.getElementsByClassName('myClass');</code></pre>

This returns an HTMLCollection (array-like object) of all elements with the specified class.

### By Tag Name

<pre><code>const elements = document.getElementsByTagName('p');</code></pre>

This returns an HTMLCollection of all elements with the specified tag.

### Using CSS Selectors

<pre><code>// Select the first matching element
const element = document.querySelector('.myClass');

// Select all matching elements
const elements = document.querySelectorAll('p.intro');</code></pre>

querySelector returns the first element that matches the specified CSS selector, while querySelectorAll returns a NodeList containing all matching elements.

## Modifying DOM Elements

Once you've selected an element, you can modify its content, attributes, and style:

### Changing Content

<pre><code>// Change text content
element.textContent = 'New text';

// Change HTML content
element.innerHTML = '&lt;span&gt;New HTML&lt;/span&gt;';</code></pre>

### Modifying Attributes

<pre><code>// Get attribute value
const src = element.getAttribute('src');

// Set attribute value
element.setAttribute('href', 'https://example.com');

// Remove attribute
element.removeAttribute('disabled');

// Check if attribute exists
const hasClass = element.hasAttribute('class');</code></pre>

### Modifying Classes

<pre><code>// Add a class
element.classList.add('active');

// Remove a class
element.classList.remove('disabled');

// Toggle a class
element.classList.toggle('highlight');

// Check if element has a class
const hasClass = element.classList.contains('selected');</code></pre>

### Changing Styles

<pre><code>// Using the style property
element.style.color = 'blue';
element.style.backgroundColor = '#f0f0f0';
element.style.fontSize = '16px';

// Note: CSS properties with hyphens are written in camelCase in JavaScript
// e.g., 'background-color' becomes 'backgroundColor'</code></pre>

## Creating and Removing Elements

### Creating Elements

<pre><code>// Create a new element
const newParagraph = document.createElement('p');

// Add content to the element
newParagraph.textContent = 'This is a new paragraph.';

// Add attributes
newParagraph.setAttribute('class', 'highlight');

// Append the element to the DOM
document.body.appendChild(newParagraph);</code></pre>

### Inserting Elements

<pre><code>// Insert before another element
const referenceElement = document.getElementById('existingElement');
document.body.insertBefore(newParagraph, referenceElement);

// Insert at a specific position
parentElement.insertAdjacentElement('beforebegin', newElement); // Before the element itself
parentElement.insertAdjacentElement('afterbegin', newElement);  // Inside the element, before its first child
parentElement.insertAdjacentElement('beforeend', newElement);   // Inside the element, after its last child
parentElement.insertAdjacentElement('afterend', newElement);    // After the element itself</code></pre>

### Removing Elements

<pre><code>// Remove an element
element.remove();

// Remove a child element
parentElement.removeChild(childElement);</code></pre>

## Traversing the DOM

You can navigate through the DOM tree using various properties:

<pre><code>// Parent node
const parent = element.parentNode;

// Child nodes
const children = element.childNodes; // Includes text nodes and comments
const firstChild = element.firstChild;
const lastChild = element.lastChild;

// Element children only
const elementChildren = element.children;
const firstElementChild = element.firstElementChild;
const lastElementChild = element.lastElementChild;

// Siblings
const nextSibling = element.nextSibling;
const previousSibling = element.previousSibling;
const nextElementSibling = element.nextElementSibling;
const previousElementSibling = element.previousElementSibling;</code></pre>

## Event Handling

Events are actions or occurrences that happen in the browser, such as a user clicking a button or a page finishing loading. JavaScript can "listen" for these events and execute code when they occur.

### Adding Event Listeners

<pre><code>// Using addEventListener
element.addEventListener('click', function(event) {
  console.log('Element clicked!');
});

// Using named function
function handleClick(event) {
  console.log('Element clicked!');
  console.log(event.target); // The element that triggered the event
}

element.addEventListener('click', handleClick);

// Removing event listener
element.removeEventListener('click', handleClick);</code></pre>

### Common Events

- **Mouse events**: click, dblclick, mousedown, mouseup, mousemove, mouseover, mouseout
- **Keyboard events**: keydown, keyup, keypress
- **Form events**: submit, change, focus, blur
- **Document/Window events**: load, resize, scroll, unload

### Event Object

When an event occurs, an event object is created with information about the event:

<pre><code>element.addEventListener('click', function(event) {
  // Prevent default behavior (e.g., for links)
  event.preventDefault();
  
  // Stop event propagation
  event.stopPropagation();
  
  // Get the element that triggered the event
  const targetElement = event.target;
  
  // Get mouse coordinates
  const x = event.clientX;
  const y = event.clientY;
});</code></pre>

## Practical Example

Let's put it all together with a practical example:

<pre><code>// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Select elements
  const addButton = document.getElementById('addButton');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  
  // Add event listener to the button
  addButton.addEventListener('click', function() {
    // Get the input value
    const taskText = taskInput.value.trim();
    
    // Check if input is not empty
    if (taskText !== '') {
      // Create a new list item
      const newTask = document.createElement('li');
      newTask.textContent = taskText;
      
      // Add a class to the new task
      newTask.classList.add('task-item');
      
      // Create a delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-btn');
      
      // Add event listener to the delete button
      deleteButton.addEventListener('click', function() {
        newTask.remove();
      });
      
      // Append the delete button to the task
      newTask.appendChild(deleteButton);
      
      // Append the new task to the task list
      taskList.appendChild(newTask);
      
      // Clear the input field
      taskInput.value = '';
      
      // Focus back on the input
      taskInput.focus();
    }
  });
});</code></pre>

This JavaScript code creates a simple task list application where users can add tasks and delete them.

## Summary

In this lesson, we've covered the fundamentals of DOM manipulation with JavaScript:

- Understanding the DOM tree structure
- Selecting elements using various methods
- Modifying element content, attributes, and styles
- Creating and removing elements
- Traversing the DOM tree
- Handling events

DOM manipulation is a crucial skill for creating interactive web applications. With these techniques, you can dynamically update your web pages in response to user actions, making your websites more engaging and user-friendly.`,
            lesson_order: 2,
            originalScript: `# DOM Manipulation

## Introduction to the DOM

The Document Object Model (DOM) is a programming interface for web documents. It represents the page so that programs can change the document structure, style, and content. The DOM represents the document as nodes and objects; this way, programming languages like JavaScript can interact with the page.

In simpler terms, the DOM is a tree-like representation of the contents of a webpage - a tree of "nodes" with different relationships depending on how they're arranged in the HTML document.

## The DOM Tree

When a web page is loaded, the browser creates a Document Object Model of the page. This model is structured like a tree:

- The **document** object is the root node
- Each HTML element becomes an element node
- Text within elements becomes text nodes
- Comments become comment nodes
- Attributes become attribute nodes

For example, consider this HTML:

<pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;My Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;Welcome&lt;/h1&gt;
  &lt;p&gt;This is my page.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

The DOM tree would look something like:

<pre><code>document
└── html
    ├── head
    │   └── title
    │       └── "My Page" (text node)
    └── body
        ├── h1
        │   └── "Welcome" (text node)
        └── p
            └── "This is my page." (text node)</code></pre>

## Accessing DOM Elements

JavaScript provides several methods to access elements in the DOM:

### By ID

<pre><code>const element = document.getElementById('myId');</code></pre>

### By Class Name

<pre><code>const elements = document.getElementsByClassName('myClass');</code></pre>

This returns an HTMLCollection (array-like object) of all elements with the specified class.

### By Tag Name

<pre><code>const elements = document.getElementsByTagName('p');</code></pre>

This returns an HTMLCollection of all elements with the specified tag.

### Using CSS Selectors

<pre><code>// Select the first matching element
const element = document.querySelector('.myClass');

// Select all matching elements
const elements = document.querySelectorAll('p.intro');</code></pre>

querySelector returns the first element that matches the specified CSS selector, while querySelectorAll returns a NodeList containing all matching elements.

## Modifying DOM Elements

Once you've selected an element, you can modify its content, attributes, and style:

### Changing Content

<pre><code>// Change text content
element.textContent = 'New text';

// Change HTML content
element.innerHTML = '&lt;span&gt;New HTML&lt;/span&gt;';</code></pre>

### Modifying Attributes

<pre><code>// Get attribute value
const src = element.getAttribute('src');

// Set attribute value
element.setAttribute('href', 'https://example.com');

// Remove attribute
element.removeAttribute('disabled');

// Check if attribute exists
const hasClass = element.hasAttribute('class');</code></pre>

### Modifying Classes

<pre><code>// Add a class
element.classList.add('active');

// Remove a class
element.classList.remove('disabled');

// Toggle a class
element.classList.toggle('highlight');

// Check if element has a class
const hasClass = element.classList.contains('selected');</code></pre>

### Changing Styles

<pre><code>// Using the style property
element.style.color = 'blue';
element.style.backgroundColor = '#f0f0f0';
element.style.fontSize = '16px';

// Note: CSS properties with hyphens are written in camelCase in JavaScript
// e.g., 'background-color' becomes 'backgroundColor'</code></pre>

## Creating and Removing Elements

### Creating Elements

<pre><code>// Create a new element
const newParagraph = document.createElement('p');

// Add content to the element
newParagraph.textContent = 'This is a new paragraph.';

// Add attributes
newParagraph.setAttribute('class', 'highlight');

// Append the element to the DOM
document.body.appendChild(newParagraph);</code></pre>

### Inserting Elements

<pre><code>// Insert before another element
const referenceElement = document.getElementById('existingElement');
document.body.insertBefore(newParagraph, referenceElement);

// Insert at a specific position
parentElement.insertAdjacentElement('beforebegin', newElement); // Before the element itself
parentElement.insertAdjacentElement('afterbegin', newElement);  // Inside the element, before its first child
parentElement.insertAdjacentElement('beforeend', newElement);   // Inside the element, after its last child
parentElement.insertAdjacentElement('afterend', newElement);    // After the element itself</code></pre>

### Removing Elements

<pre><code>// Remove an element
element.remove();

// Remove a child element
parentElement.removeChild(childElement);</code></pre>

## Traversing the DOM

You can navigate through the DOM tree using various properties:

<pre><code>// Parent node
const parent = element.parentNode;

// Child nodes
const children = element.childNodes; // Includes text nodes and comments
const firstChild = element.firstChild;
const lastChild = element.lastChild;

// Element children only
const elementChildren = element.children;
const firstElementChild = element.firstElementChild;
const lastElementChild = element.lastElementChild;

// Siblings
const nextSibling = element.nextSibling;
const previousSibling = element.previousSibling;
const nextElementSibling = element.nextElementSibling;
const previousElementSibling = element.previousElementSibling;</code></pre>

## Event Handling

Events are actions or occurrences that happen in the browser, such as a user clicking a button or a page finishing loading. JavaScript can "listen" for these events and execute code when they occur.

### Adding Event Listeners

<pre><code>// Using addEventListener
element.addEventListener('click', function(event) {
  console.log('Element clicked!');
});

// Using named function
function handleClick(event) {
  console.log('Element clicked!');
  console.log(event.target); // The element that triggered the event
}

element.addEventListener('click', handleClick);

// Removing event listener
element.removeEventListener('click', handleClick);</code></pre>

### Common Events

- **Mouse events**: click, dblclick, mousedown, mouseup, mousemove, mouseover, mouseout
- **Keyboard events**: keydown, keyup, keypress
- **Form events**: submit, change, focus, blur
- **Document/Window events**: load, resize, scroll, unload

### Event Object

When an event occurs, an event object is created with information about the event:

<pre><code>element.addEventListener('click', function(event) {
  // Prevent default behavior (e.g., for links)
  event.preventDefault();
  
  // Stop event propagation
  event.stopPropagation();
  
  // Get the element that triggered the event
  const targetElement = event.target;
  
  // Get mouse coordinates
  const x = event.clientX;
  const y = event.clientY;
});</code></pre>

## Practical Example

Let's put it all together with a practical example:

<pre><code>// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Select elements
  const addButton = document.getElementById('addButton');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  
  // Add event listener to the button
  addButton.addEventListener('click', function() {
    // Get the input value
    const taskText = taskInput.value.trim();
    
    // Check if input is not empty
    if (taskText !== '') {
      // Create a new list item
      const newTask = document.createElement('li');
      newTask.textContent = taskText;
      
      // Add a class to the new task
      newTask.classList.add('task-item');
      
      // Create a delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-btn');
      
      // Add event listener to the delete button
      deleteButton.addEventListener('click', function() {
        newTask.remove();
      });
      
      // Append the delete button to the task
      newTask.appendChild(deleteButton);
      
      // Append the new task to the task list
      taskList.appendChild(newTask);
      
      // Clear the input field
      taskInput.value = '';
      
      // Focus back on the input
      taskInput.focus();
    }
  });
});</code></pre>

This JavaScript code creates a simple task list application where users can add tasks and delete them.

## Summary

In this lesson, we've covered the fundamentals of DOM manipulation with JavaScript:

- Understanding the DOM tree structure
- Selecting elements using various methods
- Modifying element content, attributes, and styles
- Creating and removing elements
- Traversing the DOM tree
- Handling events

DOM manipulation is a crucial skill for creating interactive web applications. With these techniques, you can dynamically update your web pages in response to user actions, making your websites more engaging and user-friendly.`
          }
        ]
      }
    ]);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate form
      if (!courseData.title.trim()) {
        throw new Error('Course title is required');
      }
      if (!courseData.description.trim()) {
        throw new Error('Course description is required');
      }
      if (courseData.price < 0) {
        throw new Error('Price must be a positive number');
      }
      if (modules.length === 0) {
        throw new Error('At least one module is required');
      }
      
      // Validate modules and lessons
      for (const module of modules) {
        if (!module.title.trim()) {
          throw new Error('Module title is required');
        }
        if (!module.description.trim()) {
          throw new Error('Module description is required');
        }
        if (module.lessons.length === 0) {
          throw new Error(`Module "${module.title}" must have at least one lesson`);
        }
        for (const lesson of module.lessons) {
          if (!lesson.title.trim()) {
            throw new Error('Lesson title is required');
          }
          if (!lesson.lesson_script.trim()) {
            throw new Error(`Lesson "${lesson.title}" content is required`);
          }
        }
      }
      
      // Create course
      const course = await CourseService.createCourse(courseData);
      
      // Create modules and lessons
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const moduleData: CreateModuleData = {
          course_id: course.id,
          title: module.title,
          description: module.description,
          module_order: i + 1,
          content_raw: module.content_raw
        };
        
        const createdModule = await CourseService.createModule(moduleData);
        
        // Create lessons for this module
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j];
          
          const lessonData: CreateLessonData = {
            module_id: createdModule.id,
            title: lesson.title,
            lesson_order: j + 1,
            content_raw: lesson.content_raw,
            lesson_script: lesson.lesson_script,
            duration: '45 mins' // Default duration
          };
          
          const createdLesson = await CourseService.createLesson(lessonData);
          
          // Save quiz if available
          if (lesson.quizzes?.questions?.length) {
            await CourseService.saveLessonQuiz(createdLesson.id, lesson.quizzes.questions);
          }
          
          // Save flashcards if available
          if (lesson.flashcards?.length) {
            await CourseService.saveLessonFlashcards(createdLesson.id, lesson.flashcards);
          }
        }
      }
      
      // Navigate to course edit page
      navigate(`/teacher/dashboard/edit-course/${course.id}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem('courseCreationGuideDismissed', 'true');
  };

  const dismissGuideWithConfirmation = () => {
    if (window.confirm("Are you sure you want to hide this guide? It won't appear again.")) {
      dismissGuide();
    }
  };

  // Rich text editor modules and formats
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
        <p className="text-gray-600">Share your knowledge and expertise with learners worldwide</p>
      </div>

      {/* Course Creation Guide */}
      {showGuide && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="book-bookmark-bold-duotone" size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Creation Process</h3>
                <p className="text-gray-700 mb-4">
                  Creating a course on Onliversity is a simple process. Here's how it works:
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Course Details</p>
                    <p className="text-gray-700">
                      Start by providing basic information about your course: title, description, category, difficulty level, and price.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Create Modules</p>
                    <p className="text-gray-700">
                      Organize your course into modules. Each module represents a section or chapter of your course.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Add Lessons</p>
                    <p className="text-gray-700">
                      Create individual lessons within each module. For each lesson, you'll provide:
                    </p>
                    <ul className="mt-2 space-y-1 text-gray-700">
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Lesson content (text, code examples, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Optional quizzes to test knowledge</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check-circle-bold-duotone" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <span>Flashcards for key concepts</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">AI Assistance Available</p>
                    <p className="text-gray-700">
                      Need help creating content? Our AI can help generate lesson scripts, quizzes, and flashcards based on your input.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={dismissGuideWithConfirmation}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Don't show this again
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowGuide(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon name="close-circle-bold-duotone" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Course Creation Form */}
      <div className="card p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="danger-circle-bold-duotone" size={20} className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
            <button
              onClick={handleGenerateRandomData}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Icon name="magic-wand-bold-duotone" size={16} />
              Fill with Sample Data
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={courseData.title}
                onChange={handleInputChange}
                placeholder="e.g., 'Complete JavaScript Course: From Beginner to Advanced'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Course Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of what students will learn in this course..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={courseData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="science">Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="arts-humanities">Arts & Humanities</option>
                  <option value="language-learning">Language Learning</option>
                  <option value="health-medicine">Health & Medicine</option>
                  <option value="personal-development">Personal Development</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level *
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={courseData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all-levels">All Levels</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={courseData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Course Image
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                  {courseData.image_url && (
                    <img 
                      src={courseData.image_url} 
                      alt="Course thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="image"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Upload Image
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 1280x720px (16:9 ratio)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Modules & Lessons</h2>
            <button
              onClick={handleAddModule}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Icon name="add-square-bold-duotone" size={16} />
              Add Module
            </button>
          </div>
          
          {modules.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Icon name="book-bookmark-bold-duotone" size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No modules yet</h3>
              <p className="text-gray-500 mb-4">Add modules to organize your course content</p>
              <button
                onClick={handleAddModule}
                className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
              >
                Add First Module
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-[#2727E6] rounded-full flex items-center justify-center text-white font-semibold">
                            {moduleIndex + 1}
                          </div>
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                            placeholder="Module Title"
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <textarea
                          value={module.description}
                          onChange={(e) => handleModuleChange(moduleIndex, 'description', e.target.value)}
                          placeholder="Module Description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                          required
                        />
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleMoveModule(moduleIndex, 'up')}
                          disabled={moduleIndex === 0}
                          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <Icon name="arrow-up-bold-duotone" size={16} />
                        </button>
                        <button
                          onClick={() => handleMoveModule(moduleIndex, 'down')}
                          disabled={moduleIndex === modules.length - 1}
                          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <Icon name="arrow-down-bold-duotone" size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(moduleIndex)}
                          className="p-2 text-red-500 hover:text-red-700"
                          title="Delete Module"
                        >
                          <Icon name="trash-bin-trash-bold-duotone" size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Module Content
                      </label>
                      <div className="mb-2">
                        <input
                          type="file"
                          id={`module-file-${moduleIndex}`}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleModuleChange(moduleIndex, 'file', e.target.files[0]);
                            }
                          }}
                          ref={(el) => moduleFileInputRefs.current[moduleIndex] = el}
                          accept=".txt,.md,.doc,.docx,.pdf"
                          className="hidden"
                        />
                        <button
                          onClick={() => moduleFileInputRefs.current[moduleIndex]?.click()}
                          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Upload Document
                        </button>
                        {module.file && (
                          <span className="ml-2 text-sm text-gray-600">
                            {module.file.name}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={module.content_raw || ''}
                        onChange={(e) => handleModuleChange(moduleIndex, 'content_raw', e.target.value)}
                        placeholder="Enter raw content for this module or upload a document"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                      />
                    </div>
                    
                    <div className="flex items-end gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Lessons to Generate
                        </label>
                        <select
                          value={module.numLessonsToGenerate || 1}
                          onChange={(e) => handleModuleChange(moduleIndex, 'numLessonsToGenerate', parseInt(e.target.value))}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>1 Lesson</option>
                          <option value={2}>2 Lessons</option>
                          <option value={3}>3 Lessons</option>
                          <option value={4}>4 Lessons</option>
                          <option value={5}>5 Lessons</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleGenerateAndDistributeLessons(moduleIndex)}
                        disabled={!module.content_raw || isGeneratingLessons[moduleIndex]}
                        className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingLessons[moduleIndex] ? (
                          <>
                            <Icon name="spinner-bold-duotone" size={16} className="animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Icon name="brain-bold-duotone" size={16} />
                            Distribute & Generate Lessons
                          </>
                        )}
                      </button>
                      <div className="flex-1 text-right">
                        <button
                          onClick={() => handleAddLesson(moduleIndex)}
                          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1 ml-auto"
                        >
                          <Icon name="add-square-bold-duotone" size={14} />
                          Add Lesson Manually
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Lessons</h3>
                    
                    {module.lessons.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 mb-2">No lessons yet</p>
                        <button
                          onClick={() => handleAddLesson(moduleIndex)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Add First Lesson
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div 
                            key={lessonIndex} 
                            className={`border border-gray-200 rounded-lg p-4 ${
                              currentModule === moduleIndex && currentLesson === lessonIndex
                                ? 'border-blue-300 bg-blue-50'
                                : ''
                            }`}
                            onClick={() => {
                              setCurrentModule(moduleIndex);
                              setCurrentLesson(lessonIndex);
                            }}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 bg-[#2727E6] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {lessonIndex + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'title', e.target.value)}
                                    placeholder="Lesson Title"
                                    className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveLesson(moduleIndex, lessonIndex, 'up');
                                  }}
                                  disabled={lessonIndex === 0}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <Icon name="arrow-up-bold-duotone" size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveLesson(moduleIndex, lessonIndex, 'down');
                                  }}
                                  disabled={lessonIndex === module.lessons.length - 1}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <Icon name="arrow-down-bold-duotone" size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(moduleIndex, lessonIndex);
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Delete Lesson"
                                >
                                  <Icon name="trash-bin-trash-bold-duotone" size={14} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Raw Content
                              </label>
                              <textarea
                                value={lesson.content_raw}
                                onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'content_raw', e.target.value)}
                                placeholder="Enter raw content for this lesson"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                              />
                              <div className="flex justify-end mt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateLessonScript(moduleIndex, lessonIndex);
                                  }}
                                  disabled={!lesson.content_raw || lesson.isGeneratingScript}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {lesson.isGeneratingScript ? (
                                    <>
                                      <Icon name="spinner-bold-duotone" size={14} className="animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Icon name="brain-bold-duotone" size={14} />
                                      Generate Lesson Script
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                  Lesson Script
                                </label>
                                {lesson.originalScript && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRevertToOriginalScript(moduleIndex, lessonIndex);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Revert to Original
                                  </button>
                                )}
                              </div>
                              <div className="border border-gray-300 rounded-lg">
                                <ReactQuill
                                  theme="snow"
                                  value={lesson.lesson_script}
                                  onChange={(value) => handleLessonChange(moduleIndex, lessonIndex, 'lesson_script', value)}
                                  modules={quillModules}
                                  placeholder="Lesson content will appear here"
                                />
                              </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-3 mt-4">
                              <div className="flex flex-wrap gap-2">
                                <div className="flex-1 min-w-[200px]">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Quiz</h4>
                                    <div className="flex gap-2">
                                      <select
                                        value={lesson.quizzes?.numQuestions || 5}
                                        onChange={(e) => handleUpdateQuizSettings(moduleIndex, lessonIndex, 'numQuestions', parseInt(e.target.value))}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                                      >
                                        <option value={3}>3 Questions</option>
                                        <option value={5}>5 Questions</option>
                                        <option value={10}>10 Questions</option>
                                      </select>
                                      <select
                                        value={lesson.quizzes?.questionType || 'mcq'}
                                        onChange={(e) => handleUpdateQuizSettings(moduleIndex, lessonIndex, 'questionType', e.target.value)}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                                      >
                                        <option value="mcq">Multiple Choice</option>
                                        <option value="true_false">True/False</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateQuiz(moduleIndex, lessonIndex);
                                      }}
                                      disabled={!lesson.lesson_script || lesson.isGeneratingQuiz}
                                      className="flex-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {lesson.isGeneratingQuiz ? (
                                        <>
                                          <Icon name="spinner-bold-duotone" size={14} className="animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Icon name="brain-bold-duotone" size={14} />
                                          Generate Quiz
                                        </>
                                      )}
                                    </button>
                                    {lesson.quizzes?.questions?.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveQuiz(moduleIndex, lessonIndex);
                                        }}
                                        disabled={!lesson.id}
                                        className="px-3 py-1 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Icon name="save-bold-duotone" size={14} />
                                        Save
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-[200px]">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Flashcards</h4>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateFlashcards(moduleIndex, lessonIndex);
                                      }}
                                      disabled={!lesson.lesson_script || lesson.isGeneratingFlashcards}
                                      className="flex-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {lesson.isGeneratingFlashcards ? (
                                        <>
                                          <Icon name="spinner-bold-duotone" size={14} className="animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Icon name="brain-bold-duotone" size={14} />
                                          Generate Flashcards
                                        </>
                                      )}
                                    </button>
                                    {lesson.flashcards?.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveFlashcards(moduleIndex, lessonIndex);
                                        }}
                                        disabled={!lesson.id}
                                        className="px-3 py-1 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Icon name="save-bold-duotone" size={14} />
                                        Save
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Quiz Questions */}
                              {lesson.quizzes?.questions?.length > 0 && (
                                <div className="mt-3 border-t border-gray-200 pt-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-sm font-medium text-gray-700">
                                      Quiz Questions ({lesson.quizzes.questions.length})
                                    </h5>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddQuizQuestion(moduleIndex, lessonIndex);
                                      }}
                                      className="text-xs text-purple-600 hover:text-purple-800"
                                    >
                                      + Add Question
                                    </button>
                                  </div>
                                  <div className="space-y-3 max-h-60 overflow-y-auto p-2">
                                    {lesson.quizzes.questions.map((question, qIndex) => (
                                      <div key={question.id} className="border border-gray-200 rounded-lg p-2">
                                        <div className="flex justify-between items-start mb-2">
                                          <input
                                            type="text"
                                            value={question.question}
                                            onChange={(e) => handleUpdateQuizQuestion(moduleIndex, lessonIndex, qIndex, 'question', e.target.value)}
                                            placeholder="Question text"
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                          />
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteQuizQuestion(moduleIndex, lessonIndex, qIndex);
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                          >
                                            <Icon name="trash-bin-trash-bold-duotone" size={14} />
                                          </button>
                                        </div>
                                        <div className="space-y-1 mb-2">
                                          {question.options.map((option, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                              <input
                                                type="radio"
                                                checked={question.correct_answer === oIndex}
                                                onChange={() => handleUpdateQuizQuestion(moduleIndex, lessonIndex, qIndex, 'correct_answer', oIndex)}
                                                className="w-4 h-4"
                                              />
                                              <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleUpdateQuizOption(moduleIndex, lessonIndex, qIndex, oIndex, e.target.value)}
                                                placeholder={`Option ${oIndex + 1}`}
                                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                                disabled={question.type === 'true_false' && (option === 'True' || option === 'False')}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <input
                                          type="text"
                                          value={question.explanation || ''}
                                          onChange={(e) => handleUpdateQuizQuestion(moduleIndex, lessonIndex, qIndex, 'explanation', e.target.value)}
                                          placeholder="Explanation (optional)"
                                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Flashcards */}
                              {lesson.flashcards?.length > 0 && (
                                <div className="mt-3 border-t border-gray-200 pt-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-sm font-medium text-gray-700">
                                      Flashcards ({lesson.flashcards.length})
                                    </h5>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddFlashcard(moduleIndex, lessonIndex);
                                      }}
                                      className="text-xs text-green-600 hover:text-green-800"
                                    >
                                      + Add Flashcard
                                    </button>
                                  </div>
                                  <div className="space-y-3 max-h-60 overflow-y-auto p-2">
                                    {lesson.flashcards.map((flashcard, fIndex) => (
                                      <div key={flashcard.id} className="border border-gray-200 rounded-lg p-2">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex-1">
                                            <input
                                              type="text"
                                              value={flashcard.front}
                                              onChange={(e) => handleUpdateFlashcard(moduleIndex, lessonIndex, fIndex, 'front', e.target.value)}
                                              placeholder="Front (Question)"
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                                            />
                                            <input
                                              type="text"
                                              value={flashcard.back}
                                              onChange={(e) => handleUpdateFlashcard(moduleIndex, lessonIndex, fIndex, 'back', e.target.value)}
                                              placeholder="Back (Answer)"
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                            />
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFlashcard(moduleIndex, lessonIndex, fIndex);
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                          >
                                            <Icon name="trash-bin-trash-bold-duotone" size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/teacher/dashboard/my-courses')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Icon name="spinner-bold-duotone" size={16} className="animate-spin" />
                Creating Course...
              </>
            ) : (
              <>
                <Icon name="check-circle-bold-duotone" size={16} />
                Create Course
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips for Creating Successful Courses</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Course Structure</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Organize content into logical modules and lessons</li>
              <li>• Start with fundamentals before advanced concepts</li>
              <li>• Include practical exercises and examples</li>
              <li>• Add quizzes to reinforce learning</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Content Quality</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Use clear, concise explanations</li>
              <li>• Include real-world applications</li>
              <li>• Update content regularly to stay relevant</li>
              <li>• Respond to student questions promptly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCreate;