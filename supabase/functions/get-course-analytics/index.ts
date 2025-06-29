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

    // Get course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('instructor_id', user.id)
      .single();

    if (courseError) {
      console.error('Course fetch error:', courseError);
      return new Response(
        JSON.stringify({ error: 'Course not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get enrollments for this course
    const { data: enrollments, error: enrollmentsError } = await supabaseClient
      .from('enrollments')
      .select('student_id, enrolled_at, progress')
      .eq('course_id', courseId);

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

    // Get modules for this course
    const { data: modules, error: modulesError } = await supabaseClient
      .from('modules')
      .select(`
        id,
        title,
        lessons(
          id,
          title
        )
      `)
      .eq('course_id', courseId);

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

    // Flatten lessons from all modules
    const lessons = modules?.flatMap(module => 
      module.lessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    ) || [];

    // Get lesson completion data
    const lessonCompletionRates = await Promise.all(
      lessons.map(async (lesson) => {
        // Get total enrollments
        const totalEnrollments = enrollments?.length || 0;
        
        // Get completed lessons
        const { count: completedCount, error: completedError } = await supabaseClient
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('lesson_id', lesson.id)
          .eq('completed', true);

        if (completedError) {
          console.error('Lesson progress fetch error:', completedError);
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            completionRate: 0,
            averageQuizScore: 0
          };
        }

        // Get quiz attempts for this lesson
        const { data: quizAttempts, error: quizError } = await supabaseClient
          .from('student_quiz_attempts')
          .select('score')
          .eq('lesson_id', lesson.id);

        if (quizError) {
          console.error('Quiz attempts fetch error:', quizError);
        }

        // Calculate average quiz score
        const averageQuizScore = quizAttempts && quizAttempts.length > 0
          ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
          : 0;

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completionRate: totalEnrollments > 0 ? (completedCount || 0) / totalEnrollments * 100 : 0,
          averageQuizScore
        };
      })
    );

    // Calculate enrollment trend (by month)
    const enrollmentTrend = generateEnrollmentTrend(enrollments || []);

    // Calculate progress distribution
    const progressDistribution = [
      { range: '0-25%', count: enrollments?.filter(e => e.progress <= 25).length || 0 },
      { range: '26-50%', count: enrollments?.filter(e => e.progress > 25 && e.progress <= 50).length || 0 },
      { range: '51-75%', count: enrollments?.filter(e => e.progress > 50 && e.progress <= 75).length || 0 },
      { range: '76-100%', count: enrollments?.filter(e => e.progress > 75).length || 0 }
    ];

    // Return the analytics data
    return new Response(
      JSON.stringify({
        id: course.id,
        title: course.title,
        totalStudents: enrollments?.length || 0,
        totalRevenue: (enrollments?.length || 0) * course.price,
        averageProgress: enrollments && enrollments.length > 0
          ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
          : 0,
        averageRating: 4.7, // Mock data - would be calculated from actual ratings
        enrollmentTrend,
        progressDistribution,
        lessonCompletionRates
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-course-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate enrollment trend
function generateEnrollmentTrend(enrollments: any[]) {
  // Get last 12 months
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }).reverse();

  // Count enrollments per month
  const enrollmentCounts: { [key: string]: number } = {};
  
  last12Months.forEach(month => {
    enrollmentCounts[month] = 0;
  });

  enrollments.forEach(enrollment => {
    const enrollmentMonth = new Date(enrollment.enrolled_at).toISOString().split('T')[0].substring(0, 7);
    
    // Only count enrollments in the last 12 months
    if (last12Months.includes(enrollmentMonth)) {
      enrollmentCounts[enrollmentMonth] = (enrollmentCounts[enrollmentMonth] || 0) + 1;
    }
  });

  // Format data for charts
  return last12Months.map(month => ({
    date: month,
    count: enrollmentCounts[month]
  }));
}