import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface SimulateEnrollmentRequest {
  course_id: number;
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

    // Parse request body
    const { course_id }: SimulateEnrollmentRequest = await req.json();

    if (!course_id) {
      return new Response(
        JSON.stringify({ error: 'course_id is required' }),
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

    // Check if course exists
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, title')
      .eq('id', course_id)
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

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course_id)
      .single();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'Already enrolled in this course' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: course_id,
        enrolled_at: new Date().toISOString(),
        progress: 0
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment creation error:', enrollmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create enrollment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get all lessons for this course to create progress records
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from('lessons')
      .select('id')
      .eq('course_id', course_id);

    if (lessonsError) {
      console.error('Lessons fetch error:', lessonsError);
    } else if (lessons && lessons.length > 0) {
      // Create lesson progress records for all lessons
      const progressRecords = lessons.map(lesson => ({
        student_id: user.id,
        lesson_id: lesson.id,
        completed: false,
        completed_at: null
      }));

      const { error: progressError } = await supabaseClient
        .from('lesson_progress')
        .insert(progressRecords);

      if (progressError) {
        console.error('Progress records creation error:', progressError);
        // Don't fail the enrollment if progress records fail
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Enrollment successful',
        enrollment_id: enrollment.id,
        course_title: course.title
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in simulate-enrollment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});