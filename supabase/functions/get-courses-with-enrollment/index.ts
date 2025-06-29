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

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabaseClient
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('Database fetch error:', coursesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch courses' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's enrollments
    const { data: enrollments, error: enrollmentsError } = await supabaseClient
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    if (enrollmentsError) {
      console.error('Enrollments fetch error:', enrollmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a set of enrolled course IDs for quick lookup
    const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || []);

    // Add enrollment status and student count to courses
    const coursesWithEnrollment = await Promise.all(
      (courses || []).map(async (course) => {
        // Get student count for this course
        const { count: studentCount } = await supabaseClient
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        return {
          ...course,
          is_enrolled: enrolledCourseIds.has(course.id),
          student_count: studentCount || 0
        };
      })
    );

    // Return the courses with enrollment status
    return new Response(
      JSON.stringify({
        courses: coursesWithEnrollment
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-courses-with-enrollment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});