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

    // Extract course ID from URL
    const url = new URL(req.url);
    const courseId = url.pathname.split('/').pop();

    if (!courseId || isNaN(Number(courseId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid course ID' }),
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

    // Fetch course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
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

    // Check if user is enrolled
    const { data: enrollment } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single();

    // Get student count
    const { count: studentCount } = await supabaseClient
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabaseClient
      .from('modules')
      .select(`
        id,
        title,
        description,
        module_order
      `)
      .eq('course_id', courseId)
      .order('module_order');

    if (modulesError) {
      console.error('Modules fetch error:', modulesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch modules' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For each module, fetch its lessons
    const modulesWithLessons = await Promise.all((modules || []).map(async (module) => {
      const { data: lessons, error: lessonsError } = await supabaseClient
        .from('lessons')
        .select('id, title, lesson_order, duration')
        .eq('module_id', module.id)
        .order('lesson_order');

      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError);
        return {
          ...module,
          lessons: []
        };
      }

      return {
        ...module,
        lessons: lessons || []
      };
    }));

    // Return course details with enrollment status
    return new Response(
      JSON.stringify({
        course: {
          ...course,
          is_enrolled: !!enrollment,
          student_count: studentCount || 0
        },
        modules: modulesWithLessons
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-course-details function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});