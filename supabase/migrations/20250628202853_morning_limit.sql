/*
  # Get Upcoming Lessons Function
  
  1. Function Description
     - Creates a function to retrieve upcoming scheduled lessons for a student
     - Returns lessons that are scheduled on or after a specified date
     - Only returns lessons that haven't been completed yet
     
  2. Parameters
     - p_user_id: The student's user ID
     - p_date: The date from which to find upcoming lessons
     - p_limit: Maximum number of lessons to return (default: 5)
     
  3. Return Values
     - id: Lesson ID
     - title: Lesson title
     - scheduled_date: When the lesson is scheduled
     - path_title: Title of the learning path
     - module_title: Title of the module
*/

CREATE OR REPLACE FUNCTION public.get_upcoming_lessons(
  p_user_id text,
  p_date date,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id integer,
  title text,
  scheduled_date date,
  path_title text,
  module_title text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ppl.id,
    ppl.title,
    ppl.scheduled_date,
    plp.title as path_title,
    ppm.title as module_title
  FROM 
    personal_path_lessons ppl
  JOIN 
    personal_path_modules ppm ON ppl.personal_path_module_id = ppm.id
  JOIN 
    personal_learning_paths plp ON ppm.personal_learning_path_id = plp.id
  LEFT JOIN 
    personal_lesson_progress plpr ON plpr.personal_path_lesson_id = ppl.id AND plpr.student_id = p_user_id::uuid
  WHERE 
    plp.student_id = p_user_id::uuid
    AND ppl.scheduled_date >= p_date
    AND (plpr.completed IS NULL OR plpr.completed = false)
  ORDER BY 
    ppl.scheduled_date ASC
  LIMIT 
    p_limit;
END;
$$;