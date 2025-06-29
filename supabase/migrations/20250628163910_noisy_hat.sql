CREATE OR REPLACE FUNCTION public.get_upcoming_lessons(
  user_id text,
  current_date date,
  limit_count integer DEFAULT 5
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
    personal_lesson_progress plpr ON plpr.personal_path_lesson_id = ppl.id AND plpr.student_id = user_id::uuid
  WHERE 
    plp.student_id = user_id::uuid
    AND ppl.scheduled_date >= current_date
    AND (plpr.completed IS NULL OR plpr.completed = false)
  ORDER BY 
    ppl.scheduled_date ASC
  LIMIT 
    limit_count;
END;
$$;