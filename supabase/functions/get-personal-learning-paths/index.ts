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

    // Fetch all personal learning paths for the student
    const { data: paths, error: fetchError } = await supabaseClient
      .from('personal_learning_paths')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch personal learning paths' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For each path, calculate progress
    const pathsWithProgress = await Promise.all((paths || []).map(async (path) => {
      // Get all modules for this path
      const { data: modules, error: modulesError } = await supabaseClient
        .from('personal_path_modules')
        .select('id')
        .eq('personal_learning_path_id', path.id);

      if (modulesError) {
        console.error('Modules fetch error:', modulesError);
        return {
          ...path,
          progress: 0,
          total_lessons: 0,
          completed_lessons: 0
        };
      }

      // Get all lessons for these modules
      const moduleIds = modules?.map(m => m.id) || [];
      if (moduleIds.length === 0) {
        return {
          ...path,
          progress: 0,
          total_lessons: 0,
          completed_lessons: 0
        };
      }

      const { data: lessons, error: lessonsError } = await supabaseClient
        .from('personal_path_lessons')
        .select('id')
        .in('personal_path_module_id', moduleIds);

      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError);
        return {
          ...path,
          progress: 0,
          total_lessons: 0,
          completed_lessons: 0
        };
      }

      const totalLessons = lessons?.length || 0;
      if (totalLessons === 0) {
        return {
          ...path,
          progress: 0,
          total_lessons: 0,
          completed_lessons: 0
        };
      }

      // Get completed lessons
      const lessonIds = lessons?.map(l => l.id) || [];
      const { data: progress, error: progressError } = await supabaseClient
        .from('personal_lesson_progress')
        .select('*')
        .eq('student_id', user.id)
        .in('personal_path_lesson_id', lessonIds)
        .eq('completed', true);

      if (progressError) {
        console.error('Progress fetch error:', progressError);
        return {
          ...path,
          progress: 0,
          total_lessons: totalLessons,
          completed_lessons: 0
        };
      }

      const completedLessons = progress?.length || 0;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...path,
        progress: progressPercentage,
        total_lessons: totalLessons,
        completed_lessons: completedLessons
      };
    }));

    // Return the personal learning paths with progress
    return new Response(
      JSON.stringify({
        paths: pathsWithProgress || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-personal-learning-paths function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});