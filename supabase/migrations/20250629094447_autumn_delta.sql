/*
  # Create get_upcoming_lessons function

  1. New Functions
    - `get_upcoming_lessons` - Returns upcoming lessons for a user from their personal learning paths
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