/*
  # Create student personal lessons table

  1. New Tables
    - `student_personal_lessons`
      - `id` (serial, primary key)
      - `student_id` (text, references auth.uid())
      - `title` (text, lesson title)
      - `lesson_script` (text, AI-generated lesson content)
      - `duration` (text, default 'Generated')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `student_personal_lessons` table
    - Add policies for students to manage their own personal lessons
*/

-- Create student_personal_lessons table
CREATE TABLE IF NOT EXISTS student_personal_lessons (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  lesson_script TEXT NOT NULL,
  duration TEXT DEFAULT 'Generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_personal_lessons ENABLE ROW LEVEL SECURITY;

-- Policies for student_personal_lessons
CREATE POLICY "Students can view their own personal lessons" 
  ON student_personal_lessons FOR SELECT 
  USING (student_id = auth.uid()::text);

CREATE POLICY "Students can create their own personal lessons" 
  ON student_personal_lessons FOR INSERT 
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "Students can update their own personal lessons" 
  ON student_personal_lessons FOR UPDATE 
  USING (student_id = auth.uid()::text);

CREATE POLICY "Students can delete their own personal lessons" 
  ON student_personal_lessons FOR DELETE 
  USING (student_id = auth.uid()::text);