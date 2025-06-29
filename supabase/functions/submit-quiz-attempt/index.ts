import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface SubmitQuizAttemptRequest {
  lesson_id: number;
  quiz_id: number;
  answers: any;
  score: number;
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
    const { lesson_id, quiz_id, answers, score }: SubmitQuizAttemptRequest = await req.json();

    if (!lesson_id || !quiz_id || !answers || score === undefined) {
      return new Response(
        JSON.stringify({ error: 'lesson_id, quiz_id, answers, and score are required' }),
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

    // Verify student is enrolled in the course
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select(`
        modules(
          course_id
        )
      `)
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', lesson.modules.course_id)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'Not enrolled in this course' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert or update quiz attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('student_quiz_attempts')
      .upsert({
        student_id: user.id,
        lesson_id: lesson_id,
        quiz_id: quiz_id,
        answers: answers,
        score: score,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Quiz attempt error:', attemptError);
      return new Response(
        JSON.stringify({ error: 'Failed to save quiz attempt' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If the quiz is passed (score is good enough), mark the lesson as complete
    if (score >= 70) { // Assuming 70% is passing
      // Get the lesson script to count segments
      const { data: lessonData, error: lessonDataError } = await supabaseClient
        .from('lessons')
        .select('lesson_script')
        .eq('id', lesson_id)
        .single();
        
      if (lessonDataError) {
        console.error('Lesson fetch error:', lessonDataError);
      } else {
        // Count the total number of segments in the lesson script
        const segments = lessonData.lesson_script.split(/^## /m);
        const totalSegments = segments.length;
        
        // Update the lesson progress
        const { error: progressError } = await supabaseClient
          .from('lesson_progress')
          .upsert({
            student_id: user.id,
            lesson_id: lesson_id,
            completed: true,
            completed_at: new Date().toISOString(),
            last_completed_segment_index: totalSegments
          }, {
            onConflict: 'student_id,lesson_id'
          });
          
        if (progressError) {
          console.error('Progress update error:', progressError);
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Quiz attempt submitted successfully',
        attempt_id: attempt.id,
        score: score
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-quiz-attempt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});