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

    // Fetch the lesson to check access rights
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select(`
        id,
        module_id,
        modules!inner(
          course_id,
          courses!inner(instructor_id)
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

    // Check if user is the instructor or a student enrolled in the course
    const isInstructor = lesson.modules.courses.instructor_id === user.id;
    
    if (!isInstructor) {
      // Check if student is enrolled
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', lesson.modules.course_id)
        .single();

      if (enrollmentError || !enrollment) {
        return new Response(
          JSON.stringify({ error: 'Access denied: not enrolled in this course' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Fetch flashcards from the database
    const { data: flashcardsData, error: flashcardsError } = await supabaseClient
      .from('lesson_flashcards')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    if (flashcardsError) {
      // If no flashcards found, return an empty array
      if (flashcardsError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            id: `flashcards-${lessonId}`,
            flashcards: []
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // For other errors, return the error
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flashcards', details: flashcardsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return flashcards data
    return new Response(
      JSON.stringify({
        id: flashcardsData.id,
        flashcards: flashcardsData.flashcards
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-lesson-flashcards function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});