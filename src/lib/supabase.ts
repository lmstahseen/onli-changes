import { createClient } from '@supabase/supabase-js';

// Cache the supabase URL and key to avoid re-parsing on every import
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client to be reused throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'onliversity-auth'
  },
  global: {
    fetch: (...args) => {
      // Add custom fetch options here if needed
      return fetch(...args);
    }
  },
  // Add cache configuration for better performance
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
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
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  module_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  lesson_order: number;
  lesson_script: string;
  duration: string;
  created_at: string;
  updated_at: string;
  content_raw?: string;
}

export interface Enrollment {
  id: number;
  student_id: string;
  course_id: number;
  enrolled_at: string;
  progress: number;
}

export interface LessonProgress {
  id: number;
  student_id: string;
  lesson_id: number;
  completed: boolean;
  completed_at?: string;
  last_completed_segment_index: number;
}

export interface StudentPersonalLesson {
  id: number;
  student_id: string;
  title: string;
  lesson_script: string;
  duration: string;
  created_at: string;
  updated_at: string;
}