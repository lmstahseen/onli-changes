import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface TavusConversationRequest {
  replica_id: string;
  persona_id?: string;
  conversation_name?: string;
  conversational_context?: string;
  custom_greeting?: string;
  properties?: {
    enable_recording?: boolean;
    enable_closed_captions?: boolean;
  };
}

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

interface StartTavusPersonalPathRequest {
  personal_path_lesson_id: number;
  start_from_beginning?: boolean;
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
    const { personal_path_lesson_id, start_from_beginning = false }: StartTavusPersonalPathRequest = await req.json();

    if (!personal_path_lesson_id) {
      return new Response(
        JSON.stringify({ error: 'personal_path_lesson_id is required' }),
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

    // Fetch the personal path lesson
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('personal_path_lessons')
      .select(`
        *,
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
      .eq('id', personal_path_lesson_id)
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

    // Check if user owns the lesson
    if (lesson.personal_path_modules.personal_learning_paths.student_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get lesson progress
    let lastCompletedSegmentIndex = 0;
    
    // Try to find progress by student and lesson
    const { data: progress, error: progressError } = await supabaseClient
      .from('personal_lesson_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('personal_path_lesson_id', personal_path_lesson_id)
      .single();

    if (!progressError && progress) {
      lastCompletedSegmentIndex = progress.last_completed_segment_index || 0;
    }

    // Determine which part of the lesson script to send
    let conversationalContext = lesson.lesson_script;
    let customGreeting = `Hello! Welcome to your lesson on ${lesson.title}. I'm your AI tutor and I'll be teaching you about this topic today. Let's begin!`;

    if (!start_from_beginning && lastCompletedSegmentIndex > 0) {
      // Split the lesson script by ## headings
      const segments = lesson.lesson_script.split(/^## /m);
      
      // The first segment might not have a ## heading, so we need to handle it specially
      const firstSegment = segments[0].startsWith('#') ? segments[0] : '';
      const remainingSegments = segments.slice(firstSegment ? 0 : 1);
      
      // If we have segments and the last completed segment index is valid
      if (remainingSegments.length > 0 && lastCompletedSegmentIndex < remainingSegments.length) {
        // Get the segments from the last completed one onwards
        const remainingContent = remainingSegments.slice(lastCompletedSegmentIndex).join('## ');
        conversationalContext = remainingContent;
        
        // Update the greeting to indicate we're resuming
        customGreeting = `Welcome back to your lesson on ${lesson.title}. Let's continue from where we left off.`;
      }
    }

    // Use the provided Tavus credentials
    const tavusApiKey = '159b41eea25b4c57b821d93e9bf50a7b';
    const replicaId = 'rf4703150052';
    const personaId = 'p48fdf065d6b';

    console.log('Creating Tavus conversation with:', {
      replica_id: replicaId,
      persona_id: personaId,
      lesson_title: lesson.title,
      resuming: !start_from_beginning && lastCompletedSegmentIndex > 0
    });

    // Prepare Tavus API request using the simple format from the snippet
    const conversationRequest: TavusConversationRequest = {
      replica_id: replicaId,
      persona_id: personaId,
      conversation_name: `Onliversity Personal Path Lesson: ${lesson.title}`,
      conversational_context: conversationalContext,
      custom_greeting: customGreeting,
      properties: {
        enable_recording: false,
        enable_closed_captions: true
      }
    };

    // Make request to Tavus API using the exact format from the snippet
    const tavusResponse = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey
      },
      body: JSON.stringify(conversationRequest)
    });

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      console.error('Tavus API error:', {
        status: tavusResponse.status,
        statusText: tavusResponse.statusText,
        body: errorText
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Tavus conversation',
          details: errorText,
          status: tavusResponse.status
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tavusData: TavusConversationResponse = await tavusResponse.json();

    console.log('Tavus conversation created successfully:', {
      conversation_id: tavusData.conversation_id,
      status: tavusData.status
    });

    // Return the conversation URL
    return new Response(
      JSON.stringify({
        conversation_url: tavusData.conversation_url,
        conversation_id: tavusData.conversation_id,
        lesson_title: lesson.title,
        path_title: lesson.personal_path_modules.personal_learning_paths.title,
        resuming: !start_from_beginning && lastCompletedSegmentIndex > 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in start-tavus-personal-path-conversation function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});