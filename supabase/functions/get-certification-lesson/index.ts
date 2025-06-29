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

    // Fetch the lesson with module and certification information
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('certification_lessons')
      .select(`
        *,
        module_id,
        certification_modules!inner(
          id,
          title,
          certification_id,
          certifications!inner(
            id,
            title
          )
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError) {
      console.error('Lesson fetch error:', lessonError);
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is enrolled in the certification
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('certification_enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('certification_id', lesson.certification_modules.certification_id)
      .single();

    if (enrollmentError) {
      return new Response(
        JSON.stringify({ error: 'Not enrolled in this certification' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get lesson progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('certification_lesson_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    // Format the response
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      lesson_script: lesson.lesson_script,
      duration: lesson.duration,
      module: {
        id: lesson.certification_modules.id,
        title: lesson.certification_modules.title,
        certification: {
          id: lesson.certification_modules.certifications.id,
          title: lesson.certification_modules.certifications.title
        }
      },
      progress: progress || {
        completed: false,
        completed_at: null,
        last_completed_segment_index: 0
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
    console.error('Error in get-certification-lesson function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});