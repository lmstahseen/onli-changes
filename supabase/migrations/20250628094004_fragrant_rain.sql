/*
  # Personal Lesson Quizzes Schema

  1. New Tables
    - `personal_lesson_quizzes`
      - `id` (serial, primary key)
      - `personal_lesson_id` (integer, foreign key to student_personal_lessons)
      - `student_id` (text, references auth.uid())
      - `questions` (jsonb, stores quiz questions and answers)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on the table
    - Add policies for students to manage their own quizzes
*/

-- Check if table exists first to avoid errors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_lesson_quizzes') THEN
    -- Create personal_lesson_quizzes table
    CREATE TABLE personal_lesson_quizzes (
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
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can view their own quizzes') THEN
    DROP POLICY "Students can view their own quizzes" ON personal_lesson_quizzes;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can create their own quizzes') THEN
    DROP POLICY "Students can create their own quizzes" ON personal_lesson_quizzes;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can update their own quizzes') THEN
    DROP POLICY "Students can update their own quizzes" ON personal_lesson_quizzes;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can delete their own quizzes') THEN
    DROP POLICY "Students can delete their own quizzes" ON personal_lesson_quizzes;
  END IF;
END $$;

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