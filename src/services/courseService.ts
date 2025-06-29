import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCourseData {
  title: string;
  description: string;
  price: number;
  category: string;
  difficulty: string;
  image_url: string;
}

export interface CreateModuleData {
  course_id: number;
  title: string;
  description: string;
  module_order: number;
  content_raw?: string;
}

export interface CreateLessonData {
  module_id: number;
  title: string;
  lesson_order: number;
  content_raw: string;
  lesson_script: string;
  duration?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface Quiz {
  id?: number;
  lesson_id: number;
  questions: QuizQuestion[];
}

export interface CreateQuizData {
  lesson_id: number;
  questions: QuizQuestion[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: string;
  instructor_name: string;
  price: number;
  category: string;
  difficulty: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  is_enrolled?: boolean;
  student_count?: number;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  module_order: number;
  content_raw?: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  lesson_order: number;
  content_raw: string;
  lesson_script: string;
  duration: string;
  created_at: string;
  updated_at: string;
}

export interface CourseDetails {
  course: Course;
  modules: {
    id: number;
    title: string;
    description: string;
    module_order: number;
    lessons: {
      id: number;
      title: string;
      lesson_order: number;
      duration: string;
    }[];
  }[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
  progress: number;
}

export class CourseService {
  static async createCourse(courseData: CreateCourseData): Promise<Course> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-course`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create course');
    }

    const data = await response.json();
    return data.course;
  }

  static async createModule(moduleData: CreateModuleData): Promise<Module> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-module`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create module');
    }

    const data = await response.json();
    return data.module;
  }

  static async updateModule(moduleId: number, moduleData: Partial<CreateModuleData>): Promise<Module> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('modules')
      .update(moduleData)
      .eq('id', moduleId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update module');
    }

    return data;
  }

  static async deleteModule(moduleId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      throw new Error('Failed to delete module');
    }
  }

  static async createLesson(lessonData: CreateLessonData): Promise<Lesson> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-lesson`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...lessonData,
          duration: lessonData.duration || '45 mins'
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lesson');
    }

    const data = await response.json();
    return data.lesson;
  }

  static async updateLesson(lessonId: number, lessonData: Partial<CreateLessonData>): Promise<Lesson> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update lesson');
    }

    return data;
  }

  static async deleteLesson(lessonId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      throw new Error('Failed to delete lesson');
    }
  }

  static async createQuiz(quizData: CreateQuizData): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-quiz`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create quiz');
    }
  }

  static async generateQuiz(lessonScript: string, numQuestions: number, questionType: 'mcq' | 'true_false'): Promise<{questions: QuizQuestion[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lesson_script: lessonScript,
          num_questions: numQuestions,
          question_type: questionType
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate quiz');
    }

    const data = await response.json();
    return data;
  }

  static async saveLessonQuiz(lessonId: number, questions: QuizQuestion[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const quizData: CreateQuizData = {
      lesson_id: lessonId,
      questions: questions
    };

    await this.createQuiz(quizData);
  }

  static async generateLessonScript(contentRaw: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson-script`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content_raw: contentRaw }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate lesson script');
    }

    const data = await response.json();
    return data.lesson_script;
  }

  static async generateLessonFlashcards(
    lessonId: number,
    numCards: number
  ): Promise<{flashcards: Flashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    // Generate mock flashcards for now
    const mockFlashcards: Flashcard[] = [];
    for (let i = 0; i < numCards; i++) {
      mockFlashcards.push({
        id: uuidv4(),
        front: `Question ${i + 1}: What is the key concept discussed in this lesson?`,
        back: `Answer ${i + 1}: The key concept is understanding the fundamental principles and their applications.`
      });
    }

    return { flashcards: mockFlashcards };
  }

  static async saveLessonFlashcards(lessonId: number, flashcards: Flashcard[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    // Insert flashcards directly into the database
    const { error } = await supabase
      .from('lesson_flashcards')
      .upsert({
        lesson_id: lessonId,
        flashcards: flashcards,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'lesson_id'
      });

    if (error) {
      throw new Error('Failed to save flashcards');
    }
  }

  static async parseDocumentContent(file: File): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document-content`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse document content');
    }

    const data = await response.json();
    return data.content;
  }

  static async getTeacherCourses(): Promise<Course[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-teacher-courses`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch courses');
    }

    const data = await response.json();
    return data.courses;
  }

  static async getAllCourses(): Promise<Course[]> {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch courses');
    }

    return courses || [];
  }

  static async getAllCoursesWithEnrollmentStatus(): Promise<Course[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // If not authenticated, return courses without enrollment status
      return this.getAllCourses();
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-courses-with-enrollment`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Fallback to regular courses if function fails
      return this.getAllCourses();
    }

    const data = await response.json();
    return data.courses;
  }

  static async getCourseDetails(courseId: string): Promise<CourseDetails> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-course-details/${courseId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch course details');
    }

    const data = await response.json();
    return data;
  }

  static async getCourseById(courseId: string): Promise<Course> {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      throw new Error('Course not found');
    }

    return course;
  }

  static async simulateEnrollment(courseId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate-enrollment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_id: courseId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to enroll in course');
    }
  }

  static async getLessonQuiz(lessonId: string): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-lesson-quiz/${lessonId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch quiz');
    }

    const data = await response.json();
    return data.quiz;
  }

  static async getEnrolledStudents(courseId: number): Promise<EnrolledStudent[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-enrolled-students`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_id: courseId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch enrolled students');
    }

    const data = await response.json();
    return data.students;
  }

  static async getLessonFlashcards(lessonId: string): Promise<{id: string, flashcards: Flashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-lesson-flashcards/${lessonId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // If no flashcards found, return empty array
      return { id: `flashcards-${lessonId}`, flashcards: [] };
    }

    const data = await response.json();
    return data;
  }
}