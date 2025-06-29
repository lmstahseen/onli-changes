import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface CalendarRequest {
  year: number;
  month: number; // 0-11 (JavaScript month)
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
    const { year, month }: CalendarRequest = await req.json();

    if (year === undefined || month === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: year, month' }),
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

    // Calculate the first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Format dates for SQL query
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    // Fetch all lessons scheduled for this month
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
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date');

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

    // Group lessons by date
    const calendarDays = [];
    
    // Get all days in the month
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Find lessons for this day
      const dayLessons = userLessons
        .filter(lesson => lesson.scheduled_date === dateString)
        .map(lesson => ({
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
      
      calendarDays.push({
        date,
        lessons: dayLessons
      });
    }

    // Return the calendar data
    return new Response(
      JSON.stringify({
        days: calendarDays
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-calendar-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});