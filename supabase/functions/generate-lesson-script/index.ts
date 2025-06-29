import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GenerateLessonScriptRequest {
  content_raw: string;
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
    const { content_raw }: GenerateLessonScriptRequest = await req.json();

    if (!content_raw || content_raw.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'content_raw is required' }),
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

    // Prepare the prompt for AI
    const systemPrompt = "You are an expert educational content designer. Your task is to transform raw textual content into a comprehensive, structured, and engaging lesson script suitable for an AI video avatar to deliver. The script should be clear, concise, and pedagogical, covering all key concepts from the raw content.";
    
    const userPrompt = `Generate a detailed and professionally structured lesson script from the following raw content. Include a brief introduction, main teaching points with explanations and examples, and a concise summary/conclusion. Ensure the language is suitable for interactive learning and easy for an AI avatar to present. 

IMPORTANT: Structure the lesson with clear markdown headings using ## for main sections. Each section should represent a distinct part of the lesson that can be taught independently. For example:

## Introduction to the Topic
(Content here)

## Key Concept 1
(Content here)

## Key Concept 2
(Content here)

And so on. These headings are critical for the system to track progress through the lesson.

Raw Content:
${content_raw}`;

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      // For demo purposes, use a mock response
      const mockLessonScript = generateMockLessonScript(content_raw);
      
      return new Response(
        JSON.stringify({
          lesson_script: mockLessonScript
        }),
        { 
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
        'X-Title': 'Onliversity'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      
      // Fallback to mock response if API fails
      const mockLessonScript = generateMockLessonScript(content_raw);
      
      return new Response(
        JSON.stringify({
          lesson_script: mockLessonScript
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openRouterData = await openRouterResponse.json();
    const lessonScript = openRouterData.choices?.[0]?.message?.content;

    if (!lessonScript) {
      // Fallback to mock response if no content generated
      const mockLessonScript = generateMockLessonScript(content_raw);
      
      return new Response(
        JSON.stringify({
          lesson_script: mockLessonScript
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the generated lesson script
    return new Response(
      JSON.stringify({
        lesson_script: lessonScript
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-lesson-script function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate a mock lesson script when API is unavailable
function generateMockLessonScript(content: string): string {
  const paragraphs = content.split(/\n\n+/);
  const firstParagraph = paragraphs[0] || '';
  const title = firstParagraph.split('.')[0] || 'Introduction';
  
  // Extract potential topics from the content
  const topics = [];
  const sentences = content.split(/[.!?]+/);
  
  for (let i = 0; i < sentences.length && topics.length < 3; i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 20 && sentence.length < 100) {
      topics.push(sentence);
    }
  }
  
  while (topics.length < 3) {
    topics.push(`Key Concept ${topics.length + 1}`);
  }
  
  // Generate a structured lesson script
  return `# ${title}

## Introduction
${firstParagraph}

This lesson will cover the following key concepts:
- ${topics[0]}
- ${topics[1]}
- ${topics[2]}

## ${topics[0]}
Let's start by exploring ${topics[0]}. This is a fundamental concept that will help you understand the rest of the material.

${paragraphs[1] || 'This section would contain detailed explanations and examples related to this concept.'}

## ${topics[1]}
Now that we understand the basics, let's move on to ${topics[1]}.

${paragraphs[2] || 'This section would contain detailed explanations and examples related to this concept.'}

## ${topics[2]}
Finally, let's discuss ${topics[2]} and how it relates to what we've learned so far.

${paragraphs[3] || 'This section would contain detailed explanations and examples related to this concept.'}

## Summary and Conclusion
In this lesson, we've covered:
- ${topics[0]}
- ${topics[1]}
- ${topics[2]}

Understanding these concepts will provide you with a solid foundation for the next lessons in this course.`;
}