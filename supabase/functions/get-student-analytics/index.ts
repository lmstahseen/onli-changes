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

    // Get completed lessons
    const { data: completedLessons, error: lessonsError } = await supabaseClient
      .from('lesson_progress')
      .select('completed_at, lesson_id')
      .eq('student_id', user.id)
      .eq('completed', true);

    if (lessonsError) {
      console.error('Lessons fetch error:', lessonsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lesson progress' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get quiz attempts
    const { data: quizAttempts, error: quizError } = await supabaseClient
      .from('student_quiz_attempts')
      .select('score')
      .eq('student_id', user.id);

    if (quizError) {
      console.error('Quiz attempts fetch error:', quizError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch quiz attempts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get enrolled courses with progress
    const { data: enrollments, error: enrollmentsError } = await supabaseClient
      .from('enrollments')
      .select(`
        progress,
        enrolled_at,
        courses!inner (
          id,
          title
        )
      `)
      .eq('student_id', user.id);

    if (enrollmentsError) {
      console.error('Enrollments fetch error:', enrollmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate average quiz score
    const averageQuizScore = quizAttempts && quizAttempts.length > 0
      ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
      : 0;

    // Format enrolled courses
    const enrolledCoursesData = enrollments?.map(enrollment => ({
      id: enrollment.courses.id,
      title: enrollment.courses.title,
      progress: enrollment.progress,
      lastActivity: enrollment.enrolled_at // This would ideally be the last activity date
    })) || [];

    // Generate activity data (last 30 days)
    const activityData = generateActivityData(completedLessons || []);

    // Calculate total study hours (estimate 45 minutes per completed lesson)
    const totalStudyHours = Math.round((completedLessons?.length || 0) * 0.75);

    // Calculate streak days
    const streakDays = calculateStreakDays(completedLessons || []);

    // Return the analytics data
    return new Response(
      JSON.stringify({
        totalLessonsCompleted: completedLessons?.length || 0,
        averageQuizScore,
        enrolledCourses: enrolledCoursesData,
        activityData,
        totalStudyHours,
        streakDays
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-student-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions
function generateActivityData(completedLessons: any[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  // Count lessons completed per day
  const activityCounts: { [key: string]: number } = {};
  
  completedLessons.forEach(lesson => {
    if (!lesson.completed_at) return;
    
    const date = new Date(lesson.completed_at).toISOString().split('T')[0];
    activityCounts[date] = (activityCounts[date] || 0) + 1;
  });

  // Format data for the last 30 days
  return last30Days.map(date => ({
    date,
    count: activityCounts[date] || 0
  }));
}

function calculateStreakDays(completedLessons: any[]) {
  if (completedLessons.length === 0) return 0;
  
  // Get unique dates when lessons were completed
  const completionDates = completedLessons
    .filter(lesson => lesson.completed_at)
    .map(lesson => new Date(lesson.completed_at).toISOString().split('T')[0])
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completionDates.length === 0) return 0;

  // Check if the most recent date is today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (completionDates[0] !== today && completionDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < completionDates.length; i++) {
    const currentDate = new Date(completionDates[i-1]);
    const prevDate = new Date(completionDates[i]);
    
    // Check if dates are consecutive
    currentDate.setDate(currentDate.getDate() - 1);
    if (currentDate.toISOString().split('T')[0] === completionDates[i]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}