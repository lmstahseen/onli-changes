import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GenerateAILessonRequest {
  topic: string;
  document_content?: string;
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
    const { topic, document_content }: GenerateAILessonRequest = await req.json();

    if (!topic || topic.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
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

    // Construct prompt for DeepSeek AI
    let prompt = `Create a comprehensive, detailed lesson script on the topic: "${topic}".

The lesson should be structured as follows:
1. Introduction to the topic
2. Key concepts and definitions
3. Detailed explanations with examples
4. Real-world applications
5. Practice problems or exercises
6. Summary and conclusion

IMPORTANT: Structure the lesson with clear markdown headings using ## for main sections. Each section should represent a distinct part of the lesson that can be taught independently. For example:

## Introduction to the Topic
(Content here)

## Key Concept 1
(Content here)

## Key Concept 2
(Content here)

And so on. These headings are critical for the system to track progress through the lesson.

Make the lesson engaging, educational, and suitable for interactive teaching. The lesson should be approximately 30-45 minutes of content when taught by an AI tutor. Minimize deviations from the core content and stick closely to the provided structure and topic.`;

    if (document_content && document_content.trim() !== '') {
      prompt += `\n\nAdditional context from uploaded document:\n${document_content}\n\nPlease incorporate relevant information from this document into the lesson.`;
    }

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Make request to OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://onliversity.com',
        'X-Title': 'Onliversity AI Tutor'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate lesson content',
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openRouterData = await openRouterResponse.json();
    const lessonScript = openRouterData.choices?.[0]?.message?.content;

    if (!lessonScript) {
      return new Response(
        JSON.stringify({ error: 'No lesson content generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert the personal lesson into the database
    const { data: personalLesson, error: insertError } = await supabaseClient
      .from('student_personal_lessons')
      .insert({
        student_id: user.id,
        title: topic,
        lesson_script: lessonScript,
        duration: 'Generated'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save lesson' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the created lesson ID
    return new Response(
      JSON.stringify({
        lesson_id: personalLesson.id,
        title: personalLesson.title,
        message: 'Lesson generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-ai-lesson function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});