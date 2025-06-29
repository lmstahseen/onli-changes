import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface EnrollRequest {
  certification_id: number;
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
    const { certification_id }: EnrollRequest = await req.json();

    if (!certification_id) {
      return new Response(
        JSON.stringify({ error: 'certification_id is required' }),
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

    // Check if certification exists
    const { data: certification, error: certificationError } = await supabaseClient
      .from('certifications')
      .select('id, title')
      .eq('id', certification_id)
      .single();

    if (certificationError) {
      console.error('Certification fetch error:', certificationError);
      return new Response(
        JSON.stringify({ error: 'Certification not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabaseClient
      .from('certification_enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('certification_id', certification_id)
      .single();

    if (!enrollmentCheckError && existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'Already enrolled in this certification' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('certification_enrollments')
      .insert({
        student_id: user.id,
        certification_id: certification_id,
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

    // Initialize lesson progress records
    // First, get all modules for this certification
    const { data: modules, error: modulesError } = await supabaseClient
      .from('certification_modules')
      .select('id')
      .eq('certification_id', certification_id);

    if (modulesError) {
      console.error('Modules fetch error:', modulesError);
      // Don't fail the enrollment if this fails
    } else if (modules && modules.length > 0) {
      // Get all lessons for these modules
      const moduleIds = modules.map(m => m.id);
      const { data: lessons, error: lessonsError } = await supabaseClient
        .from('certification_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError);
        // Don't fail the enrollment if this fails
      } else if (lessons && lessons.length > 0) {
        // Create progress records for all lessons
        const progressRecords = lessons.map(lesson => ({
          student_id: user.id,
          lesson_id: lesson.id,
          completed: false,
          last_completed_segment_index: 0
        }));

        const { error: progressError } = await supabaseClient
          .from('certification_lesson_progress')
          .insert(progressRecords);

        if (progressError) {
          console.error('Progress records creation error:', progressError);
          // Don't fail the enrollment if this fails
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Enrollment successful',
        enrollment_id: enrollment.id,
        certification_title: certification.title
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in enroll-in-certification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});