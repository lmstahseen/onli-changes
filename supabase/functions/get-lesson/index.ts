import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  lesson_order: number;
  lesson_script: string;
  duration: string;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: number;
  title: string;
  course_id: number;
}

interface Course {
  id: number;
  title: string;
  instructor_name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract lesson ID from URL
    const url = new URL(req.url);
    const lessonId = url.pathname.split('/').pop();

    if (!lessonId || isNaN(Number(lessonId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid lesson ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Set auth for Supabase client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch lesson with module and course information
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select(`
        *,
        modules (
          id,
          title,
          course_id
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch course information
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, title, instructor_name')
      .eq('id', lesson.modules.course_id)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'Not enrolled in this course' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get lesson progress
    const { data: progress } = await supabaseClient
      .from('lesson_progress')
      .select('completed, completed_at')
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    // Return lesson data
    return new Response(
      JSON.stringify({
        lesson: {
          id: lesson.id,
          title: lesson.title,
          lesson_script: lesson.lesson_script,
          duration: lesson.duration,
          module: {
            id: lesson.modules.id,
            title: lesson.modules.title
          },
          course: {
            id: course.id,
            title: course.title,
            instructor_name: course.instructor_name
          },
          progress: progress || { completed: false, completed_at: null }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-lesson function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});