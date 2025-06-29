import { supabase } from '../lib/supabase';

export interface StudentPersonalLesson {
  id: number;
  student_id: string;
  title: string;
  lesson_script: string;
  duration: string;
  created_at: string;
  updated_at: string;
  progress?: PersonalLessonProgress | null;
}

export interface TavusPersonalConversationResponse {
  conversation_url: string;
  conversation_id: string;
  lesson_title: string;
  resuming?: boolean;
}

export interface GenerateAILessonResponse {
  lesson_id: number;
  title: string;
  message: string;
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
  id: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface PersonalLessonProgress {
  id: number;
  student_id: string;
  personal_lesson_id: number;
  completed: boolean;
  completed_at: string | null;
  last_completed_segment_index: number;
}

export class AILessonService {
  static async generateAILesson(topic: string, documentContent?: string): Promise<GenerateAILessonResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-lesson`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          document_content: documentContent
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate AI lesson');
    }

    return await response.json();
  }

  static async getStudentPersonalLessons(): Promise<StudentPersonalLesson[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-student-personal-lessons`,
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
      throw new Error(error.error || 'Failed to fetch personal lessons');
    }

    const data = await response.json();
    return data.personal_lessons;
  }

  static async getPersonalLesson(lessonId: string): Promise<StudentPersonalLesson> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-lesson/${lessonId}`,
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
      throw new Error(error.error || 'Failed to fetch personal lesson');
    }

    const data = await response.json();
    return data.personal_lesson;
  }

  static async getPersonalLessonProgress(lessonId: string): Promise<PersonalLessonProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('student_personal_lesson_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('personal_lesson_id', lessonId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, which is fine
        return null;
      }
      throw new Error('Failed to fetch lesson progress');
    }

    return data;
  }

  static async startTavusPersonalConversation(
    lessonId: number, 
    startFromBeginning: boolean = false
  ): Promise<TavusPersonalConversationResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-tavus-personal-conversation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          personal_lesson_id: lessonId,
          start_from_beginning: startFromBeginning
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start Tavus conversation');
    }

    return await response.json();
  }

  static async deletePersonalLesson(lessonId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('student_personal_lessons')
      .delete()
      .eq('id', lessonId)
      .eq('student_id', user.id);

    if (error) {
      throw new Error('Failed to delete personal lesson');
    }
  }

  static async generatePersonalLessonQuiz(
    lessonId: number, 
    numQuestions: number, 
    questionType: 'mcq' | 'true_false'
  ): Promise<Quiz> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personal-lesson-quiz`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_lesson_id: lessonId,
          num_questions: numQuestions,
          question_type: questionType
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate quiz');
    }

    return await response.json();
  }

  static async getPersonalLessonQuiz(lessonId: string): Promise<Quiz> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-lesson-quiz/${lessonId}`,
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

  static async generatePersonalLessonFlashcards(
    lessonId: number,
    numCards: number
  ): Promise<{id: string, flashcards: Flashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personal-lesson-flashcards`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_lesson_id: lessonId,
          num_cards: numCards
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate flashcards');
    }

    return await response.json();
  }

  static async getPersonalLessonFlashcards(lessonId: string): Promise<{id: string, flashcards: Flashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-lesson-flashcards/${lessonId}`,
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
      throw new Error(error.error || 'Failed to fetch flashcards');
    }

    return await response.json();
  }

  static async updatePersonalLessonProgress(
    lessonId: number,
    completed: boolean,
    lastCompletedSegmentIndex?: number
  ): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-personal-lesson-progress`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_lesson_id: lessonId,
          completed,
          last_completed_segment_index: lastCompletedSegmentIndex
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lesson progress');
    }
  }
}