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

    // Fetch all learning paths
    const { data: learningPaths, error: pathsError } = await supabaseClient
      .from('learning_paths')
      .select('*')
      .order('created_at', { ascending: false });

    if (pathsError) {
      console.error('Database fetch error:', pathsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch learning paths' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Add course count and enrollment count for each path
    const pathsWithCounts = await Promise.all(
      (learningPaths || []).map(async (path) => {
        // Get course count
        const { count: courseCount } = await supabaseClient
          .from('learning_path_courses')
          .select('*', { count: 'exact', head: true })
          .eq('learning_path_id', path.id);

        // Get enrollment count
        const { count: enrolledCount } = await supabaseClient
          .from('learning_path_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('learning_path_id', path.id);

        return {
          ...path,
          course_count: courseCount || 0,
          enrolled_count: enrolledCount || 0
        };
      })
    );

    // Return the learning paths
    return new Response(
      JSON.stringify({
        learning_paths: pathsWithCounts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-learning-paths function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});