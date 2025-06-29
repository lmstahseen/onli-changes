/*
  # Create personal lesson quizzes table

  1. New Tables
    - `personal_lesson_quizzes`
      - `id` (serial, primary key)
      - `personal_lesson_id` (integer, foreign key to student_personal_lessons)
      - `student_id` (text, references auth.uid())
      - `questions` (jsonb, stores quiz questions and answers)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on personal_lesson_quizzes table
    - Add policies for students to manage their own quizzes
*/

-- Create personal_lesson_quizzes table
CREATE TABLE IF NOT EXISTS personal_lesson_quizzes (
  id SERIAL PRIMARY KEY,
  personal_lesson_id INTEGER NOT NULL REFERENCES student_personal_lessons(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personal_lesson_id, student_id)
);

-- Enable RLS
ALTER TABLE personal_lesson_quizzes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Students can view their own quizzes" ON personal_lesson_quizzes;
  DROP POLICY IF EXISTS "Students can create their own quizzes" ON personal_lesson_quizzes;
  DROP POLICY IF EXISTS "Students can update their own quizzes" ON personal_lesson_quizzes;
  DROP POLICY IF EXISTS "Students can delete their own quizzes" ON personal_lesson_quizzes;
  
  -- Create new policies
  CREATE POLICY "Students can view their own quizzes" 
    ON personal_lesson_quizzes FOR SELECT 
    USING (student_id = auth.uid()::text);

  CREATE POLICY "Students can create their own quizzes" 
    ON personal_lesson_quizzes FOR INSERT 
    WITH CHECK (student_id = auth.uid()::text);

  CREATE POLICY "Students can update their own quizzes" 
    ON personal_lesson_quizzes FOR UPDATE 
    USING (student_id = auth.uid()::text);

  CREATE POLICY "Students can delete their own quizzes" 
    ON personal_lesson_quizzes FOR DELETE 
    USING (student_id = auth.uid()::text);
END $$;