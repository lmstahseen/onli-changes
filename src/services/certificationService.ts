import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export interface Certification {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  modules_count: number;
  lessons_count: number;
  estimated_hours: number;
  skills: string[];
  is_enrolled?: boolean;
}

export interface CertificationEnrollment {
  id: number;
  student_id: string;
  certification_id: number;
  enrolled_at: string;
  progress: number;
  completed_at: string | null;
  certificate_id: string | null;
}

export interface CertificationModule {
  id: number;
  certification_id: number;
  title: string;
  description: string;
  module_order: number;
  lessons: CertificationLesson[];
}

export interface CertificationLesson {
  id: number;
  module_id: number;
  title: string;
  lesson_order: number;
  duration: string;
  progress?: {
    completed: boolean;
    completed_at: string | null;
    last_completed_segment_index: number;
  };
}

export interface CertificationDetails {
  certification: Certification;
  modules: CertificationModule[];
  enrollment: CertificationEnrollment | null;
}

export interface CertificateData {
  id: string;
  student_name: string;
  certification_title: string;
  issue_date: string;
  skills: string[];
  certification_id: number;
}

export class CertificationService {
  static async getAllCertifications(): Promise<Certification[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-certifications`,
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
      throw new Error(error.error || 'Failed to fetch certifications');
    }

    const data = await response.json();
    return data.certifications;
  }

  static async getCertificationDetails(certificationId: string): Promise<CertificationDetails> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-certification-details/${certificationId}`,
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
      throw new Error(error.error || 'Failed to fetch certification details');
    }

    return await response.json();
  }

  static async enrollInCertification(certificationId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enroll-in-certification`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certification_id: certificationId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to enroll in certification');
    }
  }

  static async getEnrolledCertifications(): Promise<{
    completed: CertificationEnrollment[];
    in_progress: CertificationEnrollment[];
  }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-enrolled-certifications`,
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
      throw new Error(error.error || 'Failed to fetch enrolled certifications');
    }

    const data = await response.json();
    return data;
  }

  static async getCertificateData(certificationId: number): Promise<CertificateData> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-certificate-data/${certificationId}`,
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
      throw new Error(error.error || 'Failed to fetch certificate data');
    }

    const data = await response.json();
    return data.certificate;
  }

  static async markLessonComplete(lessonId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get the lesson script to count segments
    const { data: lesson, error: lessonError } = await supabase
      .from('certification_lessons')
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
      .from('certification_lesson_progress')
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

  static async submitQuizAttempt(
    lessonId: number, 
    quizId: number, 
    answers: Record<string, number>, 
    score: number
  ): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-certification-quiz-attempt`,
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

  static async generateCertificate(certificationId: number): Promise<CertificateData> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certification_id: certificationId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate certificate');
    }

    const data = await response.json();
    return data.certificate;
  }

  static formatCertificateDate(dateString: string): string {
    return format(new Date(dateString), 'MMMM d, yyyy');
  }
}