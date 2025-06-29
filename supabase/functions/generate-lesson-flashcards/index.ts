import { createClient } from 'npm:@supabase/supabase-js@2';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

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
      .from('lessons')
      .select(`
        id,
        lesson_script,
        module_id,
        modules!inner(
          course_id,
          courses!inner(instructor_id)
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

    // Check if user is the instructor or a student enrolled in the course
    const isInstructor = lesson.modules.courses.instructor_id === user.id;
    
    if (!isInstructor) {
      // Check if student is enrolled
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', lesson.modules.course_id)
        .single();

      if (enrollmentError || !enrollment) {
        return new Response(
          JSON.stringify({ error: 'Access denied: not enrolled in this course' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Prepare the prompt for AI
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
    
    let flashcardsData;
    
    if (!openRouterApiKey) {
      // Generate mock flashcards if API key is not available
      flashcardsData = generateMockFlashcards(lesson.lesson_script, num_cards);
    } else {
      try {
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
            response_format: { type: 'json_object' },
            max_tokens: 4000,
            temperature: 0.7
          })
        });

        if (!openRouterResponse.ok) {
          throw new Error(`API error: ${openRouterResponse.status}`);
        }

        const openRouterData = await openRouterResponse.json();
        const flashcardsContent = openRouterData.choices?.[0]?.message?.content;

        if (!flashcardsContent) {
          throw new Error('No content generated');
        }

        // Parse the generated flashcards JSON
        flashcardsData = JSON.parse(flashcardsContent);
        
        // Validate the flashcards structure
        if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
          throw new Error('Invalid flashcards structure');
        }
      } catch (apiError) {
        console.error('API or parsing error:', apiError);
        // Fallback to mock flashcards if API call fails
        flashcardsData = generateMockFlashcards(lesson.lesson_script, num_cards);
      }
    }

    // Ensure we have the right number of flashcards
    if (flashcardsData.flashcards.length !== num_cards) {
      console.warn(`Expected ${num_cards} flashcards, got ${flashcardsData.flashcards.length}`);
      
      // Adjust the number of flashcards if needed
      if (flashcardsData.flashcards.length < num_cards) {
        // Add more flashcards
        const mockFlashcards = generateMockFlashcards(lesson.lesson_script, num_cards - flashcardsData.flashcards.length);
        flashcardsData.flashcards = [...flashcardsData.flashcards, ...mockFlashcards.flashcards];
      } else {
        // Trim excess flashcards
        flashcardsData.flashcards = flashcardsData.flashcards.slice(0, num_cards);
      }
    }

    // Validate and clean up flashcards
    const validatedFlashcards: Flashcard[] = flashcardsData.flashcards.map((card: any, index: number) => ({
      id: card.id || `card${index + 1}`,
      front: card.front || `Question ${index + 1}`,
      back: card.back || `Answer ${index + 1}`
    }));

    // Return the generated flashcards
    return new Response(
      JSON.stringify({
        flashcards: validatedFlashcards
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-lesson-flashcards function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate mock flashcards when API is unavailable
function generateMockFlashcards(lessonScript: string, numCards: number): { flashcards: Flashcard[] } {
  const flashcards: Flashcard[] = [];
  
  // Extract potential topics from the lesson script
  const headings = lessonScript.match(/##\s+([^\n]+)/g) || [];
  const topics = headings.map(h => h.replace(/^##\s+/, '').trim());
  
  // If no headings found, extract sentences
  const sentences = lessonScript.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Determine how many topics we have to work with
  const availableTopics = topics.length > 0 ? topics : sentences;
  
  for (let i = 0; i < numCards; i++) {
    const topicIndex = i % availableTopics.length;
    const topic = availableTopics[topicIndex];
    
    flashcards.push({
      id: uuidv4(),
      front: `What is the key concept of "${topic}"?`,
      back: `The key concept involves understanding the fundamental principles and applications of ${topic}.`
    });
  }
  
  return { flashcards };
}