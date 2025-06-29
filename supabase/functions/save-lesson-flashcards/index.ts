import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface SaveFlashcardsRequest {
  lesson_id: number;
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
  }>;
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
    const { lesson_id, flashcards }: SaveFlashcardsRequest = await req.json();

    if (!lesson_id || !flashcards || !Array.isArray(flashcards)) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and flashcards array are required' }),
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
        modules(
          course_id,
          courses(instructor_id)
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

    // Check if user owns the course
    if (lesson.modules.courses.instructor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if flashcards already exist for this lesson
    const { data: existingFlashcards } = await supabaseClient
      .from('lesson_flashcards')
      .select('id')
      .eq('lesson_id', lesson_id)
      .single();

    if (existingFlashcards) {
      // Update existing flashcards
      const { error: updateError } = await supabaseClient
        .from('lesson_flashcards')
        .update({
          flashcards: flashcards,
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lesson_id);

      if (updateError) {
        console.error('Flashcards update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update flashcards' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Create new flashcards
      const { error: insertError } = await supabaseClient
        .from('lesson_flashcards')
        .insert({
          lesson_id: lesson_id,
          flashcards: flashcards,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Flashcards creation error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create flashcards' }),
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
        message: 'Flashcards saved successfully',
        lesson_id: lesson_id,
        flashcard_count: flashcards.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in save-lesson-flashcards function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});