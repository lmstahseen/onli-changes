import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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

    // Fetch the lesson with module and path information
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('personal_path_lessons')
      .select(`
        *,
        personal_path_module_id,
        personal_path_modules!inner(
          id,
          title,
          personal_learning_path_id,
          personal_learning_paths!inner(
            id,
            title,
            student_id
          )
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

    // Check if user owns the lesson
    if (lesson.personal_path_modules.personal_learning_paths.student_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get lesson progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('personal_lesson_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('personal_path_lesson_id', lessonId)
      .single();

    // Format the response
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      lesson_script: lesson.lesson_script,
      duration: lesson.duration,
      lesson_order: lesson.lesson_order,
      scheduled_date: lesson.scheduled_date,
      created_at: lesson.created_at,
      updated_at: lesson.updated_at,
      progress: progress || null,
      module: {
        id: lesson.personal_path_modules.id,
        title: lesson.personal_path_modules.title,
        path: {
          id: lesson.personal_path_modules.personal_learning_paths.id,
          title: lesson.personal_path_modules.personal_learning_paths.title
        }
      }
    };

    // Return the lesson data
    return new Response(
      JSON.stringify({
        lesson: formattedLesson
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-personal-path-lesson function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});