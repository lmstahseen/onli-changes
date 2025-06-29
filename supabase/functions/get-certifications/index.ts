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

    // Fetch all certifications
    const { data: certifications, error: fetchError } = await supabaseClient
      .from('certifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch certifications' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For each certification, get the number of modules and lessons
    const enhancedCertifications = await Promise.all((certifications || []).map(async (certification) => {
      // Get modules count
      const { count: modulesCount, error: modulesError } = await supabaseClient
        .from('certification_modules')
        .select('*', { count: 'exact', head: true })
        .eq('certification_id', certification.id);

      if (modulesError) {
        console.error('Modules count error:', modulesError);
      }

      // Get lessons count
      const { data: modules, error: modulesDataError } = await supabaseClient
        .from('certification_modules')
        .select('id')
        .eq('certification_id', certification.id);

      if (modulesDataError) {
        console.error('Modules data error:', modulesDataError);
      }

      let lessonsCount = 0;
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        const { count, error: lessonsError } = await supabaseClient
          .from('certification_lessons')
          .select('*', { count: 'exact', head: true })
          .in('module_id', moduleIds);

        if (lessonsError) {
          console.error('Lessons count error:', lessonsError);
        } else {
          lessonsCount = count || 0;
        }
      }

      // Check if user is enrolled
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from('certification_enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('certification_id', certification.id)
        .single();

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        console.error('Enrollment check error:', enrollmentError);
      }

      // Return enhanced certification
      return {
        ...certification,
        modules_count: modulesCount || 0,
        lessons_count: lessonsCount,
        estimated_hours: Math.round(lessonsCount * 0.5), // Estimate 30 minutes per lesson
        is_enrolled: !!enrollment
      };
    }));

    // Return the certifications
    return new Response(
      JSON.stringify({
        certifications: enhancedCertifications
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-certifications function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});