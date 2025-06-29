import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface CreateQuizRequest {
  lesson_id: number;
  questions: QuizQuestion[];
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
    const { lesson_id, questions }: CreateQuizRequest = await req.json();

    // Validate required fields
    if (!lesson_id || !questions || !Array.isArray(questions) || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and questions array are required' }),
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

    // Verify that the lesson exists and belongs to the user's course
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select(`
        id,
        course_id,
        courses!inner(instructor_id)
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

    // Check if user owns the course
    if (lesson.courses.instructor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if quiz already exists for this lesson
    const { data: existingQuiz } = await supabaseClient
      .from('lesson_quizzes')
      .select('id')
      .eq('lesson_id', lesson_id)
      .single();

    if (existingQuiz) {
      // Update existing quiz
      const { error: updateError } = await supabaseClient
        .from('lesson_quizzes')
        .update({
          questions: questions,
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lesson_id);

      if (updateError) {
        console.error('Quiz update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update quiz' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Create new quiz
      const { error: insertError } = await supabaseClient
        .from('lesson_quizzes')
        .insert({
          lesson_id: lesson_id,
          questions: questions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Quiz creation error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create quiz' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Quiz saved successfully',
        lesson_id: lesson_id,
        question_count: questions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-quiz function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});