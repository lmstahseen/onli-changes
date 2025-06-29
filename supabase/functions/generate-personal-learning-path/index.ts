import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GeneratePathRequest {
  goal_topic: string;
  current_standing: string;
  exam_date?: string;
  document_content?: string;
}

interface Module {
  title: string;
  description: string;
  module_order: number;
  lessons: Lesson[];
}

interface Lesson {
  title: string;
  lesson_script: string;
  duration: string;
  lesson_order: number;
  scheduled_date?: string;
}

interface LearningPath {
  title: string;
  description: string;
  modules: Module[];
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
    const { goal_topic, current_standing, exam_date, document_content }: GeneratePathRequest = await req.json();

    // Validate required fields
    if (!goal_topic || !current_standing) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: goal_topic, current_standing' }),
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

    // Calculate start and end dates
    const startDate = new Date();
    let endDate: Date;
    
    if (exam_date) {
      endDate = new Date(exam_date);
      if (isNaN(endDate.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Invalid exam_date format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Default to 3 months from now if no exam date provided
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
    }

    // Construct prompt for DeepSeek AI
    let prompt = `Create a comprehensive, personalized learning path for a student with the following goal and current knowledge level:

Goal/Topic: ${goal_topic}
Current Knowledge Level: ${current_standing}
${exam_date ? `Target Exam Date: ${exam_date}` : ''}

The learning path should include:
1. An overall title for the learning path
2. A brief description of the learning path
3. A series of modules, each with:
   - A title
   - A description
   - An ordered list of lessons
4. For each lesson:
   - A title
   - Detailed lesson content (script)
   - Estimated duration (e.g., "30 mins", "1 hour")
   - A scheduled date (if an exam date was provided)

IMPORTANT: For each lesson script, structure the content with clear markdown headings using ## for main sections. Each section should represent a distinct part of the lesson that can be taught independently. For example:

## Introduction to the Topic
(Content here)

## Key Concept 1
(Content here)

## Key Concept 2
(Content here)

And so on. These headings are critical for the system to track progress through the lesson.

The modules should build progressively from the student's current knowledge level toward their goal.
${exam_date ? `The lessons should be distributed across the timeline from today (${startDate.toISOString().split('T')[0]}) to the exam date (${exam_date}), with appropriate spacing and sequencing.` : ''}

Return your response as a JSON object with the following structure:
{
  "title": "Learning Path Title",
  "description": "Overall description of the learning path",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module 1 description",
      "module_order": 1,
      "lessons": [
        {
          "title": "Lesson 1 Title",
          "lesson_script": "Detailed lesson content...",
          "duration": "45 mins",
          "lesson_order": 1,
          "scheduled_date": "YYYY-MM-DD" // Only if exam_date was provided
        },
        // More lessons...
      ]
    },
    // More modules...
  ]
}`;

    if (document_content) {
      prompt += `\n\nAdditional context from uploaded document:\n${document_content}\n\nPlease incorporate relevant information from this document into the learning path.`;
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
        'X-Title': 'Onliversity Learning Path Generator'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: prompt
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
          error: 'Failed to generate learning path',
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openRouterData = await openRouterResponse.json();
    const generatedContent = openRouterData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'No learning path content generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the generated learning path
    let learningPathData: LearningPath;
    try {
      learningPathData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse learning path JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid learning path format generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate the learning path structure
    if (!learningPathData.title || !learningPathData.description || !Array.isArray(learningPathData.modules)) {
      return new Response(
        JSON.stringify({ error: 'Invalid learning path structure' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert the learning path into the database
    const { data: path, error: pathError } = await supabaseClient
      .from('personal_learning_paths')
      .insert({
        student_id: user.id,
        title: learningPathData.title,
        description: learningPathData.description,
        goal_topic,
        current_standing,
        exam_date: exam_date ? new Date(exam_date).toISOString() : null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        generated_content_raw: generatedContent
      })
      .select()
      .single();

    if (pathError) {
      console.error('Database insert error (path):', pathError);
      return new Response(
        JSON.stringify({ error: 'Failed to save learning path' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert modules and lessons
    for (const module of learningPathData.modules) {
      const { data: moduleData, error: moduleError } = await supabaseClient
        .from('personal_path_modules')
        .insert({
          personal_learning_path_id: path.id,
          title: module.title,
          description: module.description,
          module_order: module.module_order
        })
        .select()
        .single();

      if (moduleError) {
        console.error('Database insert error (module):', moduleError);
        continue;
      }

      for (const lesson of module.lessons) {
        const { data: lessonData, error: lessonError } = await supabaseClient
          .from('personal_path_lessons')
          .insert({
            personal_path_module_id: moduleData.id,
            title: lesson.title,
            lesson_script: lesson.lesson_script,
            duration: lesson.duration,
            lesson_order: lesson.lesson_order,
            scheduled_date: lesson.scheduled_date || null
          })
          .select()
          .single();

        if (lessonError) {
          console.error('Database insert error (lesson):', lessonError);
          continue;
        }

        // Initialize lesson progress
        const { error: progressError } = await supabaseClient
          .from('personal_lesson_progress')
          .insert({
            student_id: user.id,
            personal_path_lesson_id: lessonData.id,
            completed: false,
            last_completed_segment_index: 0
          });

        if (progressError) {
          console.error('Database insert error (progress):', progressError);
        }
      }
    }

    // Return the created learning path ID
    return new Response(
      JSON.stringify({
        path_id: path.id,
        title: path.title,
        message: 'Learning path generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-personal-learning-path function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});