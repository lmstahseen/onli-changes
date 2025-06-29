import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface EnrollInPathRequest {
  learning_path_id: number;
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
    const { learning_path_id }: EnrollInPathRequest = await req.json();

    if (!learning_path_id) {
      return new Response(
        JSON.stringify({ error: 'learning_path_id is required' }),
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

    // Check if learning path exists
    const { data: learningPath, error: pathError } = await supabaseClient
      .from('learning_paths')
      .select('id, title')
      .eq('id', learning_path_id)
      .single();

    if (pathError || !learningPath) {
      return new Response(
        JSON.stringify({ error: 'Learning path not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseClient
      .from('learning_path_enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('learning_path_id', learning_path_id)
      .single();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'Already enrolled in this learning path' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('learning_path_enrollments')
      .insert({
        student_id: user.id,
        learning_path_id: learning_path_id,
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

    // Get all courses in this learning path and enroll student in each
    const { data: pathCourses, error: coursesError } = await supabaseClient
      .from('learning_path_courses')
      .select('course_id')
      .eq('learning_path_id', learning_path_id)
      .order('course_order');

    if (coursesError) {
      console.error('Path courses fetch error:', coursesError);
    } else if (pathCourses && pathCourses.length > 0) {
      // Create enrollment records for all courses in the path
      const courseEnrollments = pathCourses.map(pathCourse => ({
        student_id: user.id,
        course_id: pathCourse.course_id,
        enrolled_at: new Date().toISOString(),
        progress: 0
      }));

      const { error: courseEnrollmentError } = await supabaseClient
        .from('enrollments')
        .upsert(courseEnrollments, { 
          onConflict: 'student_id,course_id',
          ignoreDuplicates: true 
        });

      if (courseEnrollmentError) {
        console.error('Course enrollments creation error:', courseEnrollmentError);
        // Don't fail the path enrollment if course enrollments fail
      }

      // Create lesson progress records for all lessons in all courses
      for (const pathCourse of pathCourses) {
        const { data: lessons } = await supabaseClient
          .from('lessons')
          .select('id')
          .eq('course_id', pathCourse.course_id);

        if (lessons && lessons.length > 0) {
          const progressRecords = lessons.map(lesson => ({
            student_id: user.id,
            lesson_id: lesson.id,
            completed: false,
            completed_at: null
          }));

          await supabaseClient
            .from('lesson_progress')
            .upsert(progressRecords, { 
              onConflict: 'student_id,lesson_id',
              ignoreDuplicates: true 
            });
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Enrollment successful',
        enrollment_id: enrollment.id,
        path_title: learningPath.title
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in enroll-in-path function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});