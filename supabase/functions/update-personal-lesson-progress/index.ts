import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface UpdateProgressRequest {
  personal_lesson_id: number;
  completed: boolean;
  last_completed_segment_index?: number;
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
    const { personal_lesson_id, completed, last_completed_segment_index }: UpdateProgressRequest = await req.json();

    if (!personal_lesson_id || completed === undefined) {
      return new Response(
        JSON.stringify({ error: 'personal_lesson_id and completed are required' }),
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

    // Verify the lesson exists and belongs to the user
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('student_personal_lessons')
      .select('id, lesson_script')
      .eq('id', personal_lesson_id)
      .eq('student_id', user.id)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If the lesson is being marked as complete and no segment index is provided,
    // calculate the total number of segments
    let segmentIndex = last_completed_segment_index;
    if (completed && segmentIndex === undefined) {
      // Count the total number of segments in the lesson script
      const segments = lesson.lesson_script.split(/^## /m);
      segmentIndex = segments.length;
    }

    // Check if a progress record already exists
    const { data: existingProgress } = await supabaseClient
      .from('student_personal_lesson_progress')
      .select('id')
      .eq('student_id', user.id)
      .eq('personal_lesson_id', personal_lesson_id)
      .single();

    // Prepare update data
    const progressData: any = {
      student_id: user.id,
      personal_lesson_id: personal_lesson_id,
      completed: completed,
      completed_at: completed ? new Date().toISOString() : null
    };

    if (segmentIndex !== undefined) {
      progressData.last_completed_segment_index = segmentIndex;
    }

    // Update or insert progress record
    const { data: progress, error: progressError } = await supabaseClient
      .from('student_personal_lesson_progress')
      .upsert(progressData, {
        onConflict: 'student_id,personal_lesson_id'
      })
      .select()
      .single();

    if (progressError) {
      console.error('Progress update error:', progressError);
      return new Response(
        JSON.stringify({ error: 'Failed to update progress' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Progress updated successfully',
        progress_id: progress.id,
        completed: completed,
        last_completed_segment_index: progress.last_completed_segment_index
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in update-personal-lesson-progress function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});