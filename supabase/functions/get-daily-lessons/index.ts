import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface DailyLessonsRequest {
  date: string; // YYYY-MM-DD format
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
    const { date }: DailyLessonsRequest = await req.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
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

    // Fetch all lessons scheduled for this date
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from('personal_path_lessons')
      .select(`
        id,
        title,
        duration,
        scheduled_date,
        personal_path_module_id,
        personal_path_modules!inner(
          id,
          title,
          personal_learning_path_id,
          personal_learning_paths!inner(
            id,
            title,
            student_id
          )
        )
      `)
      .eq('scheduled_date', date)
      .order('lesson_order');

    if (lessonsError) {
      console.error('Lessons fetch error:', lessonsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lessons' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter lessons to only include those belonging to the user
    const userLessons = lessons?.filter(lesson => 
      lesson.personal_path_modules.personal_learning_paths.student_id === user.id
    ) || [];

    // Fetch progress for these lessons
    const lessonIds = userLessons.map(lesson => lesson.id);
    const { data: progressData, error: progressError } = await supabaseClient
      .from('personal_lesson_progress')
      .select('*')
      .eq('student_id', user.id)
      .in('personal_path_lesson_id', lessonIds);

    if (progressError) {
      console.error('Progress fetch error:', progressError);
    }

    // Create a map of lesson ID to progress
    const progressMap = new Map();
    progressData?.forEach(progress => {
      progressMap.set(progress.personal_path_lesson_id, progress);
    });

    // Add progress to lessons
    const lessonsWithProgress = userLessons.map(lesson => ({
      ...lesson,
      progress: progressMap.get(lesson.id) || null,
      module: {
        id: lesson.personal_path_modules.id,
        title: lesson.personal_path_modules.title,
        path: {
          id: lesson.personal_path_modules.personal_learning_paths.id,
          title: lesson.personal_path_modules.personal_learning_paths.title
        }
      }
    }));

    // Return the lessons for this day
    return new Response(
      JSON.stringify({
        date,
        lessons: lessonsWithProgress
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-daily-lessons function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});