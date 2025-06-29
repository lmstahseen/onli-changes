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

    // Extract path ID from URL
    const url = new URL(req.url);
    const pathId = url.pathname.split('/').pop();

    if (!pathId || isNaN(Number(pathId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid path ID' }),
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

    // Fetch the learning path
    const { data: path, error: pathError } = await supabaseClient
      .from('personal_learning_paths')
      .select('*')
      .eq('id', pathId)
      .eq('student_id', user.id)
      .single();

    if (pathError || !path) {
      return new Response(
        JSON.stringify({ error: 'Learning path not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch modules for this path
    const { data: modules, error: modulesError } = await supabaseClient
      .from('personal_path_modules')
      .select('*')
      .eq('personal_learning_path_id', pathId)
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

    // For each module, fetch its lessons and progress
    const modulesWithLessons = await Promise.all((modules || []).map(async (module) => {
      const { data: lessons, error: lessonsError } = await supabaseClient
        .from('personal_path_lessons')
        .select('*')
        .eq('personal_path_module_id', module.id)
        .order('lesson_order');

      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError);
        return {
          ...module,
          lessons: []
        };
      }

      // For each lesson, fetch its progress
      const lessonsWithProgress = await Promise.all((lessons || []).map(async (lesson) => {
        const { data: progress, error: progressError } = await supabaseClient
          .from('personal_lesson_progress')
          .select('*')
          .eq('personal_path_lesson_id', lesson.id)
          .eq('student_id', user.id)
          .single();

        if (progressError) {
          console.error('Progress fetch error:', progressError);
          return {
            ...lesson,
            progress: null
          };
        }

        return {
          ...lesson,
          progress
        };
      }));

      return {
        ...module,
        lessons: lessonsWithProgress
      };
    }));

    // Return the learning path with modules and lessons
    return new Response(
      JSON.stringify({
        path,
        modules: modulesWithLessons
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-personal-learning-path-details function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});