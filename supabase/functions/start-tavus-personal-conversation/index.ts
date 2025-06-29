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

interface StartTavusPersonalRequest {
  personal_lesson_id: number;
  start_from_beginning?: boolean;
}

// Helper function to extract key concepts from lesson script
function extractKeyConcepts(lessonScript: string): string[] {
  // Split the script by ## headings to find main sections
  const segments = lessonScript.split(/^## /m);
  
  // Filter out empty segments and extract headings
  const concepts = segments
    .slice(1) // Skip the first segment (intro)
    .map(segment => {
      // Extract the heading (first line)
      const heading = segment.split('\n')[0].trim();
      return heading;
    })
    .filter(heading => heading && heading.length > 0);
  
  return concepts.length > 0 ? concepts : ['Introduction to the topic', 'Key concepts', 'Applications'];
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
    const { personal_lesson_id, start_from_beginning = false }: StartTavusPersonalRequest = await req.json();

    if (!personal_lesson_id) {
      return new Response(
        JSON.stringify({ error: 'personal_lesson_id is required' }),
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

    // Fetch the personal lesson
    const { data: personalLesson, error: lessonError } = await supabaseClient
      .from('student_personal_lessons')
      .select('*')
      .eq('id', personal_lesson_id)
      .eq('student_id', user.id)
      .single();

    if (lessonError || !personalLesson) {
      return new Response(
        JSON.stringify({ error: 'Personal lesson not found' }),
        { 
          status: 404, 
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
      .eq('personal_lesson_id', personal_lesson_id)
      .single();

    if (!progressError && progress) {
      lastCompletedSegmentIndex = progress.last_completed_segment_index || 0;
    }

    // Extract key concepts for the introduction
    const keyConcepts = extractKeyConcepts(personalLesson.lesson_script);
    const conceptsList = keyConcepts.map(concept => `• ${concept}`).join('\n');

    // Determine which part of the lesson script to send
    let conversationalContext = personalLesson.lesson_script;
    let customGreeting = `Hello! I'm your AI tutor for this personalized lesson on "${personalLesson.title}". In this session, we'll explore the following key concepts:\n\n${conceptsList}\n\nI'll guide you through each topic with detailed explanations and examples. Are you ready to begin with the introduction?`;

    if (!start_from_beginning && lastCompletedSegmentIndex > 0) {
      // Split the lesson script by ## headings
      const segments = personalLesson.lesson_script.split(/^## /m);
      
      // The first segment might not have a ## heading, so we need to handle it specially
      const firstSegment = segments[0].startsWith('#') ? segments[0] : '';
      const remainingSegments = segments.slice(firstSegment ? 0 : 1);
      
      // If we have segments and the last completed segment index is valid
      if (remainingSegments.length > 0 && lastCompletedSegmentIndex < remainingSegments.length) {
        // Get the segments from the last completed one onwards
        const remainingContent = remainingSegments.slice(lastCompletedSegmentIndex).join('## ');
        conversationalContext = remainingContent;
        
        // Update the greeting to indicate we're resuming
        const nextTopic = keyConcepts[lastCompletedSegmentIndex] || "the next section";
        customGreeting = `Welcome back to your personalized lesson on "${personalLesson.title}". We've already covered some important concepts, and now we'll continue with ${nextTopic}. Let me know when you're ready to proceed.`;
      }
    }

    // Use the provided Tavus credentials
    const tavusApiKey = '159b41eea25b4c57b821d93e9bf50a7b';
    const replicaId = 'rf4703150052';
    const personaId = 'p48fdf065d6b';

    console.log('Creating Tavus personal conversation with:', {
      replica_id: replicaId,
      persona_id: personaId,
      lesson_title: personalLesson.title,
      resuming: !start_from_beginning && lastCompletedSegmentIndex > 0
    });

    // Prepare Tavus API request using the simple format from the snippet
    const conversationRequest: TavusConversationRequest = {
      replica_id: replicaId,
      persona_id: personaId,
      conversation_name: `Onliversity Personal Lesson: ${personalLesson.title}`,
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

    console.log('Tavus personal conversation created successfully:', {
      conversation_id: tavusData.conversation_id,
      status: tavusData.status
    });

    // Return the conversation URL
    return new Response(
      JSON.stringify({
        conversation_url: tavusData.conversation_url,
        conversation_id: tavusData.conversation_id,
        lesson_title: personalLesson.title,
        resuming: !start_from_beginning && lastCompletedSegmentIndex > 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in start-tavus-personal-conversation function:', error);
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