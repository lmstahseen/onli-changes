import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CourseService } from '../../services/courseService';

interface Module {
  id?: number;
  title: string;
  description: string;
  module_order: number;
  lessons: Lesson[];
}

interface Lesson {
  id?: number;
  title: string;
  content_raw: string;
  lesson_order: number;
  lesson_script?: string;
}

const TeacherCreate: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Course form state
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: 49.99,
    category: 'technology',
    difficulty: 'beginner',
    image_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg'
  });
  
  // Modules and lessons state
  const [modules, setModules] = useState<Module[]>([
    {
      title: 'Module 1',
      description: 'Introduction to the course',
      module_order: 1,
      lessons: [
        {
          title: 'Lesson 1',
          content_raw: 'Welcome to the first lesson of this course.',
          lesson_order: 1
        }
      ]
    }
  ]);
  
  // UI state
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState<{moduleIndex: number, lessonIndex: number} | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  
  // Categories and difficulties
  const categories = [
    { id: 'technology', name: 'Technology' },
    { id: 'business', name: 'Business' },
    { id: 'science', name: 'Science' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'arts-humanities', name: 'Arts & Humanities' },
    { id: 'health-medicine', name: 'Health & Medicine' },
    { id: 'language-learning', name: 'Language Learning' },
    { id: 'personal-development', name: 'Personal Development' }
  ];
  
  const difficulties = [
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];
  
  // Handle course data changes
  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // Ensure price is a valid number
      const price = parseFloat(value);
      if (!isNaN(price)) {
        setCourseData({
          ...courseData,
          [name]: price
        });
      }
    } else {
      setCourseData({
        ...courseData,
        [name]: value
      });
    }
  };
  
  // Handle module changes
  const handleModuleChange = (index: number, field: string, value: string) => {
    const updatedModules = [...modules];
    updatedModules[index] = {
      ...updatedModules[index],
      [field]: value
    };
    setModules(updatedModules);
  };
  
  // Handle lesson changes
  const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    setModules(updatedModules);
  };
  
  // Add a new module
  const addModule = () => {
    const newModuleOrder = modules.length + 1;
    setModules([
      ...modules,
      {
        title: `Module ${newModuleOrder}`,
        description: '',
        module_order: newModuleOrder,
        lessons: [
          {
            title: 'Lesson 1',
            content_raw: '',
            lesson_order: 1
          }
        ]
      }
    ]);
    setActiveModule(modules.length);
  };
  
  // Add a new lesson to a module
  const addLesson = (moduleIndex: number) => {
    const updatedModules = [...modules];
    const newLessonOrder = updatedModules[moduleIndex].lessons.length + 1;
    
    updatedModules[moduleIndex].lessons.push({
      title: `Lesson ${newLessonOrder}`,
      content_raw: '',
      lesson_order: newLessonOrder
    });
    
    setModules(updatedModules);
    setActiveLesson({
      moduleIndex,
      lessonIndex: updatedModules[moduleIndex].lessons.length - 1
    });
  };
  
  // Remove a module
  const removeModule = (index: number) => {
    if (modules.length === 1) {
      setError('You must have at least one module');
      return;
    }
    
    const updatedModules = [...modules];
    updatedModules.splice(index, 1);
    
    // Update module_order for remaining modules
    updatedModules.forEach((module, i) => {
      module.module_order = i + 1;
    });
    
    setModules(updatedModules);
    
    // Update active module if needed
    if (activeModule >= updatedModules.length) {
      setActiveModule(updatedModules.length - 1);
    }
    
    // Clear active lesson if it was in the removed module
    if (activeLesson && activeLesson.moduleIndex === index) {
      setActiveLesson(null);
    } else if (activeLesson && activeLesson.moduleIndex > index) {
      // Adjust active lesson module index if it was after the removed module
      setActiveLesson({
        moduleIndex: activeLesson.moduleIndex - 1,
        lessonIndex: activeLesson.lessonIndex
      });
    }
  };
  
  // Remove a lesson
  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    if (modules[moduleIndex].lessons.length === 1) {
      setError('Each module must have at least one lesson');
      return;
    }
    
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.splice(lessonIndex, 1);
    
    // Update lesson_order for remaining lessons
    updatedModules[moduleIndex].lessons.forEach((lesson, i) => {
      lesson.lesson_order = i + 1;
    });
    
    setModules(updatedModules);
    
    // Clear active lesson if it was the removed one
    if (activeLesson && 
        activeLesson.moduleIndex === moduleIndex && 
        activeLesson.lessonIndex === lessonIndex) {
      setActiveLesson(null);
    } else if (activeLesson && 
               activeLesson.moduleIndex === moduleIndex && 
               activeLesson.lessonIndex > lessonIndex) {
      // Adjust active lesson index if it was after the removed lesson
      setActiveLesson({
        moduleIndex,
        lessonIndex: activeLesson.lessonIndex - 1
      });
    }
  };
  
  // Handle file upload for lesson content
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeLesson) return;
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploadingFile(true);
      setError(null);
      
      const content = await CourseService.parseDocumentContent(file);
      
      const updatedModules = [...modules];
      updatedModules[activeLesson.moduleIndex].lessons[activeLesson.lessonIndex].content_raw = content;
      setModules(updatedModules);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse document');
    } finally {
      setIsUploadingFile(false);
    }
  };
  
  // Generate lesson script from content
  const generateLessonScript = async (moduleIndex: number, lessonIndex: number) => {
    const lesson = modules[moduleIndex].lessons[lessonIndex];
    
    if (!lesson.content_raw.trim()) {
      setError('Please add content to generate a script');
      return;
    }
    
    try {
      setIsGeneratingScript(true);
      setError(null);
      
      const lessonScript = await CourseService.generateLessonScript(lesson.content_raw);
      
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex].lesson_script = lessonScript;
      setModules(updatedModules);
      
      setSuccess('Lesson script generated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lesson script');
    } finally {
      setIsGeneratingScript(false);
    }
  };
  
  // Validate course data
  const validateCourseData = () => {
    if (!courseData.title.trim()) return 'Course title is required';
    if (!courseData.description.trim()) return 'Course description is required';
    if (courseData.price <= 0) return 'Price must be greater than 0';
    if (!courseData.category) return 'Category is required';
    if (!courseData.difficulty) return 'Difficulty is required';
    return null;
  };
  
  // Validate modules and lessons
  const validateModulesAndLessons = () => {
    if (modules.length === 0) return 'At least one module is required';
    
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      if (!module.title.trim()) return `Module ${i + 1} title is required`;
      if (!module.description.trim()) return `Module ${i + 1} description is required`;
      
      if (module.lessons.length === 0) return `Module ${i + 1} must have at least one lesson`;
      
      for (let j = 0; j < module.lessons.length; j++) {
        const lesson = module.lessons[j];
        if (!lesson.title.trim()) return `Lesson ${j + 1} in Module ${i + 1} title is required`;
        if (!lesson.content_raw.trim()) return `Lesson ${j + 1} in Module ${i + 1} content is required`;
      }
    }
    
    return null;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate based on current step
    let validationError = null;
    
    if (activeStep === 1) {
      validationError = validateCourseData();
    } else if (activeStep === 2) {
      validationError = validateModulesAndLessons();
    }
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // If we're on step 1, move to step 2
    if (activeStep === 1) {
      setActiveStep(2);
      setError(null);
      return;
    }
    
    // If we're on step 2, submit the course
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create the course
      const course = await CourseService.createCourse(courseData);
      
      // Create modules and lessons
      for (const module of modules) {
        const createdModule = await CourseService.createModule({
          course_id: course.id,
          title: module.title,
          description: module.description,
          module_order: module.module_order
        });
        
        for (const lesson of module.lessons) {
          await CourseService.createLesson({
            module_id: createdModule.id,
            title: lesson.title,
            lesson_order: lesson.lesson_order,
            content_raw: lesson.content_raw,
            lesson_script: lesson.lesson_script || lesson.content_raw
          });
        }
      }
      
      setSuccess('Course created successfully!');
      
      // Redirect to the course view page after a short delay
      setTimeout(() => {
        navigate(`/teacher/dashboard/view-course/${course.id}`);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
        <p className="text-gray-600">Build your course structure, add content, and publish to start teaching</p>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            activeStep >= 1 ? 'bg-[#2727E6] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`h-1 flex-1 ${activeStep >= 2 ? 'bg-[#2727E6]' : 'bg-gray-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            activeStep >= 2 ? 'bg-[#2727E6] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`h-1 flex-1 ${activeStep >= 3 ? 'bg-[#2727E6]' : 'bg-gray-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            activeStep >= 3 ? 'bg-[#2727E6] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm font-medium text-gray-600">Course Details</span>
          <span className="text-sm font-medium text-gray-600">Content Creation</span>
          <span className="text-sm font-medium text-gray-600">Review & Publish</span>
        </div>
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="danger-circle-bold-duotone" size={20} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="check-circle-bold-duotone" size={20} className="text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}
      
      {/* Step 1: Course Details */}
      {activeStep === 1 && (
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Details</h2>
          
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
                onChange={handleCourseChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 'Complete JavaScript Course'"
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
                onChange={handleCourseChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide a detailed description of your course..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={courseData.price}
                  onChange={handleCourseChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={courseData.category}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
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
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty.id} value={difficulty.id}>{difficulty.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Image URL
                </label>
                <input
                  type="text"
                  id="image_url"
                  name="image_url"
                  value={courseData.image_url}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide a URL to an image for your course. Recommended size: 1280x720px.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
              >
                Continue to Content
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2: Content Creation */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Modules Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Course Structure</h2>
                <button
                  onClick={addModule}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Add Module"
                >
                  <Icon name="add-square-bold-duotone" size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <div 
                    key={moduleIndex} 
                    className={`border rounded-lg overflow-hidden ${
                      activeModule === moduleIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className={`p-3 flex justify-between items-center cursor-pointer ${
                        activeModule === moduleIndex ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                      onClick={() => setActiveModule(moduleIndex)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {moduleIndex + 1}
                        </div>
                        <span className="font-medium text-gray-900">{module.title}</span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeModule(moduleIndex);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Remove Module"
                        >
                          <Icon name="trash-bin-trash-bold-duotone" size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {activeModule === moduleIndex && (
                      <div className="p-3 border-t border-gray-200">
                        <div className="space-y-2 mb-3">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div 
                              key={lessonIndex}
                              className={`p-2 rounded-lg flex justify-between items-center cursor-pointer ${
                                activeLesson && 
                                activeLesson.moduleIndex === moduleIndex && 
                                activeLesson.lessonIndex === lessonIndex
                                  ? 'bg-blue-100'
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={() => setActiveLesson({moduleIndex, lessonIndex})}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 text-xs">
                                  {lessonIndex + 1}
                                </div>
                                <span className="text-sm">{lesson.title}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLesson(moduleIndex, lessonIndex);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600"
                                title="Remove Lesson"
                              >
                                <Icon name="trash-bin-trash-bold-duotone" size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => addLesson(moduleIndex)}
                          className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1"
                        >
                          <Icon name="add-square-bold-duotone" size={16} />
                          <span>Add Lesson</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Content Editor */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              {activeModule !== null && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Module Title *
                      </label>
                      <input
                        type="text"
                        value={modules[activeModule].title}
                        onChange={(e) => handleModuleChange(activeModule, 'title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 'Introduction to JavaScript'"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Module Description *
                      </label>
                      <textarea
                        value={modules[activeModule].description}
                        onChange={(e) => handleModuleChange(activeModule, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what students will learn in this module..."
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {activeLesson && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lesson Title *
                      </label>
                      <input
                        type="text"
                        value={modules[activeLesson.moduleIndex].lessons[activeLesson.lessonIndex].title}
                        onChange={(e) => handleLessonChange(activeLesson.moduleIndex, activeLesson.lessonIndex, 'title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 'JavaScript Variables and Data Types'"
                        required
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Lesson Content *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".txt,.md,.doc,.docx,.pdf"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingFile}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {isUploadingFile ? (
                              <>
                                <Icon name="spinner-bold-duotone" size={14} className="animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Icon name="upload-bold-duotone" size={14} />
                                <span>Upload File</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => generateLessonScript(activeLesson.moduleIndex, activeLesson.lessonIndex)}
                            disabled={isGeneratingScript || !modules[activeLesson.moduleIndex].lessons[activeLesson.lessonIndex].content_raw.trim()}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {isGeneratingScript ? (
                              <>
                                <Icon name="spinner-bold-duotone" size={14} className="animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Icon name="brain-bold-duotone" size={14} />
                                <span>Generate Script</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={modules[activeLesson.moduleIndex].lessons[activeLesson.lessonIndex].content_raw}
                        onChange={(e) => handleLessonChange(activeLesson.moduleIndex, activeLesson.lessonIndex, 'content_raw', e.target.value)}
                        rows={10}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your lesson content here or upload a file..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This content will be used to generate an AI-enhanced lesson script. You can edit it directly or upload a file.
                      </p>
                    </div>
                    
                    {modules[activeLesson.moduleIndex].lessons[activeLesson.lessonIndex].lesson_script && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Generated Lesson Script
                        </label>
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                          <div className="prose max-w-none">
                            {modules[activeLesson.moduleIndex].lessons[activeLesson.lessonIndex].lesson_script.split('\n').map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!activeLesson && activeModule !== null && (
                <div className="text-center py-12">
                  <Icon name="book-bookmark-bold-duotone" size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Lesson</h3>
                  <p className="text-gray-500 mb-4">
                    Choose a lesson from the sidebar or create a new one to start editing
                  </p>
                  <button
                    onClick={() => addLesson(activeModule)}
                    className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Create New Lesson
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setActiveStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Back to Course Details
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gradient-button text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="spinner-bold-duotone" size={20} className="animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  <>
                    Create Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Assistant Tips */}
      <div className="mt-12 card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 AI Course Creation Tips</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Creating Engaging Content</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Break content into digestible modules and lessons</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Use the AI script generator to enhance your lesson content</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Include practical examples and exercises in each lesson</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Optimizing Your Course</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Choose a compelling title and description for better discoverability</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Set an appropriate difficulty level for your target audience</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Upload high-quality images to make your course stand out</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCreate;