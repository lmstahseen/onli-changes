import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GenerateFlashcardsRequest {
  lesson_id: number;
  num_cards: number;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
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
    const { lesson_id, num_cards }: GenerateFlashcardsRequest = await req.json();

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: 'lesson_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!num_cards || num_cards < 1 || num_cards > 20) {
      return new Response(
        JSON.stringify({ error: 'num_cards must be between 1 and 20' }),
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

    // Fetch the lesson
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('certification_lessons')
      .select(`
        *,
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

    // Check if user is enrolled in the certification
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

    // Prepare the prompt for DeepSeek AI
    const systemPrompt = `You are an expert educational content creator specializing in creating effective flashcards for learning. Your task is to create high-quality flashcards based on lesson content. Each flashcard should have a clear question on the front and a concise, informative answer on the back.`;
    
    const userPrompt = `Based on the following lesson content, generate exactly ${num_cards} flashcards. Each flashcard should test a key concept from the lesson.

Return the response as a JSON object with this exact structure:
{
  "flashcards": [
    {
      "id": "card1",
      "front": "Question or concept to remember",
      "back": "Answer or explanation"
    }
  ]
}

Lesson Content:
${lesson.lesson_script}

Requirements:
- Create flashcards that test understanding of key concepts
- Front side should be a clear question or prompt
- Back side should be a concise but complete answer
- Cover the most important concepts from the lesson
- Ensure questions are clear and unambiguous
- Answers should be concise but informative`;

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
        'X-Title': 'Onliversity Flashcard Generator'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
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
        response_format: { type: 'json_object' },
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate flashcards',
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openRouterData = await openRouterResponse.json();
    const flashcardsContent = openRouterData.choices?.[0]?.message?.content;

    if (!flashcardsContent) {
      return new Response(
        JSON.stringify({ error: 'No flashcards content generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the generated flashcards JSON
    let flashcardsData;
    try {
      flashcardsData = JSON.parse(flashcardsContent);
    } catch (parseError) {
      console.error('Failed to parse flashcards JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid flashcards format generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate the flashcards structure
    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      return new Response(
        JSON.stringify({ error: 'Invalid flashcards structure' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Ensure we have the right number of flashcards
    if (flashcardsData.flashcards.length !== num_cards) {
      console.warn(`Expected ${num_cards} flashcards, got ${flashcardsData.flashcards.length}`);
    }

    // Validate and clean up flashcards
    const validatedFlashcards: Flashcard[] = flashcardsData.flashcards.map((card: any, index: number) => ({
      id: card.id || `card${index + 1}`,
      front: card.front || `Question ${index + 1}`,
      back: card.back || `Answer ${index + 1}`
    }));

    // Check if flashcards already exist for this lesson
    const { data: existingFlashcards } = await supabaseClient
      .from('certification_flashcards')
      .select('id')
      .eq('lesson_id', lesson_id)
      .single();

    let flashcardsId: number;

    if (existingFlashcards) {
      // Update existing flashcards
      const { data: updatedFlashcards, error: updateError } = await supabaseClient
        .from('certification_flashcards')
        .update({
          flashcards: validatedFlashcards,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFlashcards.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Failed to update flashcards:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update flashcards' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      flashcardsId = updatedFlashcards.id;
    } else {
      // Create new flashcards
      const { data: newFlashcards, error: insertError } = await supabaseClient
        .from('certification_flashcards')
        .insert({
          lesson_id: lesson_id,
          flashcards: validatedFlashcards,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create flashcards:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create flashcards' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      flashcardsId = newFlashcards.id;
    }

    // Return the generated flashcards
    return new Response(
      JSON.stringify({
        id: flashcardsId,
        flashcards: validatedFlashcards
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-certification-flashcards function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});