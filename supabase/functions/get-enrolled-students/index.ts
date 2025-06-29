import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GetEnrolledStudentsRequest {
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
    const { course_id }: GetEnrolledStudentsRequest = await req.json();

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

    // Verify that the user is the instructor of the course
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, instructor_id')
      .eq('id', course_id)
      .single();

    if (courseError) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (course.instructor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied: not the instructor of this course' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch enrollments with student information
    const { data: enrollments, error: enrollmentsError } = await supabaseClient
      .from('enrollments')
      .select(`
        student_id,
        enrolled_at,
        progress
      `)
      .eq('course_id', course_id);

    if (enrollmentsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments', details: enrollmentsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If no enrollments, return empty array
    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ students: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get student IDs from enrollments
    const studentIds = enrollments.map(enrollment => enrollment.student_id);

    // Fetch user data from auth.users
    const { data: authUsers, error: authUsersError } = await supabaseClient
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .in('id', studentIds);

    // If we can't access auth.users directly, try to get data from profiles table
    let studentProfiles;
    if (authUsersError) {
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, name, email')
        .in('id', studentIds);

      if (profilesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch student profiles', details: profilesError }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      studentProfiles = profiles;
    } else {
      studentProfiles = authUsers;
    }

    // Create a map of student ID to profile data
    const studentProfileMap = new Map();
    studentProfiles?.forEach(profile => {
      studentProfileMap.set(profile.id, profile);
    });

    // Combine enrollment data with student profile data
    const enrolledStudents = enrollments.map(enrollment => {
      const profile = studentProfileMap.get(enrollment.student_id);
      
      return {
        id: enrollment.student_id,
        name: profile?.name || profile?.raw_user_meta_data?.name || 'Unknown',
        email: profile?.email || 'No email available',
        enrolled_at: enrollment.enrolled_at,
        progress: enrollment.progress
      };
    });

    // Return the enrolled students
    return new Response(
      JSON.stringify({ students: enrolledStudents }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-enrolled-students function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});