import { supabase } from '../lib/supabase';

export interface LessonData {
  id: number;
  title: string;
  lesson_script: string;
  duration: string;
  module: {
    id: number;
    title: string;
  };
  course: {
    id: number;
    title: string;
    instructor_name: string;
  };
  progress: {
    completed: boolean;
    completed_at: string | null;
    last_completed_segment_index: number;
  };
}

export interface TavusConversationResponse {
  conversation_url: string;
  conversation_id: string;
  lesson_title: string;
  course_title: string;
  resuming?: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export class LessonService {
  static async getLesson(lessonId: string): Promise<LessonData> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-lesson/${lessonId}`,
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
      throw new Error(error.error || 'Failed to fetch lesson');
    }

    const data = await response.json();
    return data.lesson;
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

  static async submitQuizAttempt(lessonId: number, quizId: number, answers: any, score: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-quiz-attempt`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          quiz_id: quizId,
          answers,
          score
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit quiz attempt');
    }
  }

  static async startTavusConversation(lessonId: number, startFromBeginning: boolean = false): Promise<TavusConversationResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-tavus-conversation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lesson_id: lessonId,
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

  static async markLessonComplete(lessonId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get the lesson script to count segments
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('lesson_script')
      .eq('id', lessonId)
      .single();
      
    if (lessonError) {
      throw new Error('Failed to fetch lesson');
    }
    
    // Count the total number of segments in the lesson script
    const segments = lesson.lesson_script.split(/^## /m);
    const totalSegments = segments.length;

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        last_completed_segment_index: totalSegments
      }, {
        onConflict: 'student_id,lesson_id'
      });

    if (error) {
      throw new Error('Failed to mark lesson as complete');
    }
  }

  static async generateLessonFlashcards(
    lessonId: number,
    numCards: number
  ): Promise<{id: string, flashcards: Flashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson-flashcards`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
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
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch flashcards');
    }

    return await response.json();
  }
}