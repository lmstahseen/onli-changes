import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GenerateQuizRequest {
  lesson_script: string;
  num_questions: number;
  question_type: 'mcq' | 'true_false';
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: number;
  explanation?: string;
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
    const { lesson_script, num_questions, question_type }: GenerateQuizRequest = await req.json();

    if (!lesson_script || lesson_script.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'lesson_script is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!num_questions || num_questions < 1 || num_questions > 20) {
      return new Response(
        JSON.stringify({ error: 'num_questions must be between 1 and 20' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!question_type || !['mcq', 'true_false'].includes(question_type)) {
      return new Response(
        JSON.stringify({ error: 'question_type must be either "mcq" or "true_false"' }),
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
    const systemPrompt = `You are an expert educational assessment designer. Your task is to create high-quality quiz questions based on lesson content. Generate questions that test understanding, application, and critical thinking rather than just memorization.`;
    
    let userPrompt: string;
    
    if (question_type === 'mcq') {
      userPrompt = `Based on the following lesson content, generate exactly ${num_questions} multiple-choice questions. Each question should have 4 options (A, B, C, D) with only one correct answer.

Return the response as a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Lesson Content:
${lesson_script}

Requirements:
- Questions should test comprehension and application of key concepts
- Avoid trivial or overly obvious questions
- Make incorrect options plausible but clearly wrong
- Ensure questions are clear and unambiguous
- Include brief explanations for correct answers`;
    } else {
      userPrompt = `Based on the following lesson content, generate exactly ${num_questions} true/false questions.

Return the response as a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Statement to evaluate as true or false",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": 0,
      "explanation": "Brief explanation of why this is true/false"
    }
  ]
}

Lesson Content:
${lesson_script}

Requirements:
- Create statements that test understanding of key concepts
- Avoid trivial or trick questions
- Ensure statements are clear and unambiguous
- Include brief explanations for the correct answers
- Mix true and false answers roughly equally`;
    }

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      // For demo purposes, generate mock questions
      const mockQuestions = generateMockQuestions(lesson_script, num_questions, question_type);
      
      return new Response(
        JSON.stringify({
          questions: mockQuestions
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
        'X-Title': 'Onliversity Quiz Generator'
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
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      
      // Fallback to mock questions if API fails
      const mockQuestions = generateMockQuestions(lesson_script, num_questions, question_type);
      
      return new Response(
        JSON.stringify({
          questions: mockQuestions
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openRouterData = await openRouterResponse.json();
    const quizContent = openRouterData.choices?.[0]?.message?.content;

    if (!quizContent) {
      // Fallback to mock questions if no content generated
      const mockQuestions = generateMockQuestions(lesson_script, num_questions, question_type);
      
      return new Response(
        JSON.stringify({
          questions: mockQuestions
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the generated quiz JSON
    let quizData;
    try {
      quizData = JSON.parse(quizContent);
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError);
      
      // Fallback to mock questions if parsing fails
      const mockQuestions = generateMockQuestions(lesson_script, num_questions, question_type);
      
      return new Response(
        JSON.stringify({
          questions: mockQuestions
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate the quiz structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      // Fallback to mock questions if structure is invalid
      const mockQuestions = generateMockQuestions(lesson_script, num_questions, question_type);
      
      return new Response(
        JSON.stringify({
          questions: mockQuestions
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Ensure we have the right number of questions
    if (quizData.questions.length !== num_questions) {
      console.warn(`Expected ${num_questions} questions, got ${quizData.questions.length}`);
    }

    // Validate and clean up questions
    const validatedQuestions = quizData.questions.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      question: q.question || '',
      type: question_type,
      options: Array.isArray(q.options) ? q.options : (question_type === 'true_false' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D']),
      correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
      explanation: q.explanation || ''
    }));

    // Return the generated quiz
    return new Response(
      JSON.stringify({
        questions: validatedQuestions
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate mock questions when API is unavailable
function generateMockQuestions(lessonScript: string, numQuestions: number, questionType: 'mcq' | 'true_false'): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Extract potential topics from the lesson script
  const headings = lessonScript.match(/##\s+([^\n]+)/g) || [];
  const topics = headings.map(h => h.replace(/^##\s+/, '').trim());
  
  // If no headings found, extract sentences
  const sentences = lessonScript.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Determine how many topics we have to work with
  const availableTopics = topics.length > 0 ? topics : sentences;
  
  for (let i = 0; i < numQuestions; i++) {
    const topicIndex = i % availableTopics.length;
    const topic = availableTopics[topicIndex];
    
    if (questionType === 'mcq') {
      questions.push({
        id: `q${i + 1}`,
        question: `What is the main concept discussed in "${topic}"?`,
        type: 'mcq',
        options: [
          `The fundamental principles of ${topic}`,
          'Advanced calculus and differential equations',
          'Historical perspectives on ancient civilizations',
          'Modern art and design principles'
        ],
        correct_answer: 0,
        explanation: `This section focuses specifically on the core concepts of ${topic}.`
      });
    } else {
      questions.push({
        id: `q${i + 1}`,
        question: `The section "${topic}" covers fundamental concepts related to the main subject of this lesson.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 0,
        explanation: 'This statement is true because the section directly addresses core concepts of the lesson topic.'
      });
    }
  }
  
  return questions;
}