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

    // Verify student is enrolled in the certification
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('certification_lessons')
      .select(`
        module_id,
        certification_modules!inner(
          certification_id
        )
      `)
      .eq('id', lesson_id)
      .single();

    if (lessonError) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('certification_enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('certification_id', lesson.certification_modules.certification_id)
      .single();

    if (enrollmentError) {
      return new Response(
        JSON.stringify({ error: 'Not enrolled in this certification' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert or update quiz attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('certification_quiz_attempts')
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
    if (score >= 70) { // 70% is passing
      // Get the lesson script to count segments
      const { data: lessonData, error: lessonDataError } = await supabaseClient
        .from('certification_lessons')
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
          .from('certification_lesson_progress')
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

      // Update certification progress
      await updateCertificationProgress(
        supabaseClient,
        user.id,
        lesson.certification_modules.certification_id
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Quiz attempt submitted successfully',
        attempt_id: attempt.id,
        score: score,
        passed: score >= 70
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-certification-quiz-attempt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to update certification progress
async function updateCertificationProgress(
  supabaseClient: any,
  studentId: string,
  certificationId: number
) {
  try {
    // Get all modules for this certification
    const { data: modules, error: modulesError } = await supabaseClient
      .from('certification_modules')
      .select('id')
      .eq('certification_id', certificationId);

    if (modulesError) {
      console.error('Modules fetch error:', modulesError);
      return;
    }

    if (!modules || modules.length === 0) {
      return;
    }

    // Get all lessons for these modules
    const moduleIds = modules.map((m: any) => m.id);
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from('certification_lessons')
      .select('id')
      .in('module_id', moduleIds);

    if (lessonsError) {
      console.error('Lessons fetch error:', lessonsError);
      return;
    }

    if (!lessons || lessons.length === 0) {
      return;
    }

    // Get completed lessons
    const lessonIds = lessons.map((l: any) => l.id);
    const { data: completedLessons, error: completedError } = await supabaseClient
      .from('certification_lesson_progress')
      .select('lesson_id')
      .eq('student_id', studentId)
      .eq('completed', true)
      .in('lesson_id', lessonIds);

    if (completedError) {
      console.error('Completed lessons fetch error:', completedError);
      return;
    }

    // Calculate progress percentage
    const totalLessons = lessons.length;
    const completedCount = completedLessons?.length || 0;
    const progressPercentage = Math.round((completedCount / totalLessons) * 100);

    // Update enrollment progress
    const { error: updateError } = await supabaseClient
      .from('certification_enrollments')
      .update({
        progress: progressPercentage,
        // If all lessons are completed, mark the certification as completed
        ...(progressPercentage === 100 ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('student_id', studentId)
      .eq('certification_id', certificationId);

    if (updateError) {
      console.error('Enrollment update error:', updateError);
    }

    // If all lessons are completed, generate a certificate
    if (progressPercentage === 100) {
      // Check if a certificate already exists
      const { data: existingCertificate } = await supabaseClient
        .from('certificates')
        .select('id')
        .eq('student_id', studentId)
        .eq('certification_id', certificationId)
        .single();

      if (!existingCertificate) {
        // Generate a unique certificate ID
        const certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create certificate record
        const { error: certificateError } = await supabaseClient
          .from('certificates')
          .insert({
            id: certificateId,
            student_id: studentId,
            certification_id: certificationId,
            issue_date: new Date().toISOString()
          });

        if (certificateError) {
          console.error('Certificate creation error:', certificateError);
        } else {
          // Update enrollment with certificate ID
          await supabaseClient
            .from('certification_enrollments')
            .update({
              certificate_id: certificateId
            })
            .eq('student_id', studentId)
            .eq('certification_id', certificationId);
        }
      }
    }
  } catch (error) {
    console.error('Error updating certification progress:', error);
  }
}