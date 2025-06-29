import { supabase } from '../lib/supabase';

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_duration: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  course_count: number;
  enrolled_count: number;
}

export interface LearningPathCourse {
  id: number;
  learning_path_id: number;
  course_id: number;
  course_order: number;
  course: {
    id: number;
    title: string;
    description: string;
    instructor_name: string;
    price: number;
    difficulty: string;
    image_url: string;
  };
}

export interface LearningPathEnrollment {
  id: number;
  student_id: string;
  learning_path_id: number;
  enrolled_at: string;
  progress: number;
  completed_at: string | null;
}

export interface LearningPathDetails {
  path: LearningPath;
  courses: LearningPathCourse[];
  enrollment: LearningPathEnrollment | null;
}

export class LearningPathService {
  static async getAllLearningPaths(): Promise<LearningPath[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-learning-paths`,
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
      throw new Error(error.error || 'Failed to fetch learning paths');
    }

    const data = await response.json();
    return data.learning_paths;
  }

  static async getEnrolledPaths(): Promise<LearningPathEnrollment[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-enrolled-paths`,
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
      throw new Error(error.error || 'Failed to fetch enrolled paths');
    }

    const data = await response.json();
    return data.enrollments;
  }

  static async getLearningPathDetails(pathId: string): Promise<LearningPathDetails> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-learning-path-details/${pathId}`,
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
      throw new Error(error.error || 'Failed to fetch learning path details');
    }

    const data = await response.json();
    return data;
  }

  static async enrollInPath(pathId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enroll-in-path`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ learning_path_id: pathId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to enroll in learning path');
    }
  }
}