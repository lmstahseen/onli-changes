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

    // Extract certification ID from URL
    const url = new URL(req.url);
    const certificationId = url.pathname.split('/').pop();

    if (!certificationId || isNaN(Number(certificationId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid certification ID' }),
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

    // Fetch certification details
    const { data: certification, error: certificationError } = await supabaseClient
      .from('certifications')
      .select('*')
      .eq('id', certificationId)
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

    // Check if user is enrolled
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('certification_enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('certification_id', certificationId)
      .single();

    // Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabaseClient
      .from('certification_modules')
      .select(`
        id,
        title,
        description,
        module_order
      `)
      .eq('certification_id', certificationId)
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
        .from('certification_lessons')
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

      // If user is enrolled, get progress for each lesson
      let lessonsWithProgress = lessons || [];
      
      if (enrollment) {
        const lessonIds = lessonsWithProgress.map(l => l.id);
        
        if (lessonIds.length > 0) {
          const { data: progressData, error: progressError } = await supabaseClient
            .from('certification_lesson_progress')
            .select('*')
            .eq('student_id', user.id)
            .in('lesson_id', lessonIds);

          if (!progressError && progressData) {
            // Create a map of lesson_id to progress
            const progressMap = new Map();
            progressData.forEach(p => progressMap.set(p.lesson_id, p));
            
            // Add progress to each lesson
            lessonsWithProgress = lessonsWithProgress.map(lesson => ({
              ...lesson,
              progress: progressMap.get(lesson.id) || null
            }));
          }
        }
      }

      return {
        ...module,
        lessons: lessonsWithProgress
      };
    }));

    // Return certification details with modules and lessons
    return new Response(
      JSON.stringify({
        certification,
        modules: modulesWithLessons,
        enrollment: enrollment || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-certification-details function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});