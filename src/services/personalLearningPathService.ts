import { supabase } from '../lib/supabase';

export interface PersonalLearningPath {
  id: number;
  student_id: string;
  title: string;
  description: string;
  goal_topic: string;
  current_standing: string;
  exam_date: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface PersonalPathModule {
  id: number;
  personal_learning_path_id: number;
  title: string;
  description: string;
  module_order: number;
  created_at: string;
  updated_at: string;
  lessons?: PersonalPathLesson[];
}

export interface PersonalPathLesson {
  id: number;
  personal_path_module_id: number;
  title: string;
  lesson_script: string;
  duration: string;
  lesson_order: number;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
  progress?: PersonalLessonProgress;
}

export interface PersonalLessonProgress {
  id: number;
  student_id: string;
  personal_path_lesson_id: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  quiz_score: number | null;
  flashcards_generated: boolean;
}

export interface PersonalPathQuiz {
  id: number;
  personal_path_lesson_id: number;
  student_id: string;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface PersonalPathFlashcard {
  id: string;
  front: string;
  back: string;
}

export interface GeneratePersonalLearningPathRequest {
  goal_topic: string;
  current_standing: string;
  exam_date?: string;
  document_content?: string;
}

export interface GeneratePersonalLearningPathResponse {
  path_id: number;
  title: string;
  message: string;
}

export interface PersonalLearningPathDetails {
  path: PersonalLearningPath;
  modules: (PersonalPathModule & {
    lessons: (PersonalPathLesson & {
      progress: PersonalLessonProgress | null;
    })[];
  })[];
}

export interface CalendarDay {
  date: Date;
  lessons: (PersonalPathLesson & {
    progress: PersonalLessonProgress | null;
    module: {
      id: number;
      title: string;
      path: {
        id: number;
        title: string;
      };
    };
  })[];
}

export class PersonalLearningPathService {
  static async generatePersonalLearningPath(
    data: GeneratePersonalLearningPathRequest
  ): Promise<GeneratePersonalLearningPathResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personal-learning-path`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate personal learning path');
    }

    return await response.json();
  }

  static async getPersonalLearningPaths(): Promise<PersonalLearningPath[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-learning-paths`,
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
      throw new Error(error.error || 'Failed to fetch personal learning paths');
    }

    const data = await response.json();
    return data.paths;
  }

  static async getPersonalLearningPathDetails(pathId: string): Promise<PersonalLearningPathDetails> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-learning-path-details/${pathId}`,
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
      throw new Error(error.error || 'Failed to fetch personal learning path details');
    }

    return await response.json();
  }

  static async updatePersonalLessonProgress(
    lessonId: number,
    completed: boolean,
    notes?: string,
    quizScore?: number
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
          personal_path_lesson_id: lessonId,
          completed,
          notes,
          quiz_score: quizScore
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lesson progress');
    }
  }

  static async generatePersonalPathQuiz(
    lessonId: number,
    numQuestions: number,
    questionType: 'mcq' | 'true_false'
  ): Promise<PersonalPathQuiz> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personal-path-quiz`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_path_lesson_id: lessonId,
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

  static async getPersonalPathQuiz(lessonId: string): Promise<PersonalPathQuiz> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-path-quiz/${lessonId}`,
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

    return await response.json();
  }

  static async generatePersonalPathFlashcards(
    lessonId: number,
    numCards: number
  ): Promise<{id: string, flashcards: PersonalPathFlashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personal-path-flashcards`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_path_lesson_id: lessonId,
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

  static async getPersonalPathFlashcards(lessonId: string): Promise<{id: string, flashcards: PersonalPathFlashcard[]}> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-personal-path-flashcards/${lessonId}`,
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

  static async getCalendarData(year: number, month: number): Promise<CalendarDay[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-calendar-data`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch calendar data');
    }

    const data = await response.json();
    return data.days;
  }

  static async getDailyLessons(date: string): Promise<(PersonalPathLesson & {
    progress: PersonalLessonProgress | null;
    module: {
      id: number;
      title: string;
      path: {
        id: number;
        title: string;
      };
    };
  })[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-daily-lessons`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch daily lessons');
    }

    const data = await response.json();
    return data.lessons;
  }
}