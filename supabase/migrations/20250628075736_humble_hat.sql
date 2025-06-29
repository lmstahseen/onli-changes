/*
  # Quiz System Schema

  1. New Tables
    - `lesson_quizzes`
      - `id` (serial, primary key)
      - `lesson_id` (integer, foreign key to lessons)
      - `questions` (jsonb, stores quiz questions and answers)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `student_quiz_attempts`
      - `id` (serial, primary key)
      - `student_id` (text, references auth.uid())
      - `lesson_id` (integer, foreign key to lessons)
      - `quiz_id` (integer, foreign key to lesson_quizzes)
      - `answers` (jsonb, stores student's answers)
      - `score` (integer, percentage score)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Teachers can manage quizzes for their lessons
    - Students can view quizzes and submit attempts
*/

-- Create lesson_quizzes table
CREATE TABLE IF NOT EXISTS lesson_quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Create student_quiz_attempts table
CREATE TABLE IF NOT EXISTS student_quiz_attempts (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES lesson_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, quiz_id)
);

-- Enable RLS
ALTER TABLE lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for lesson_quizzes
CREATE POLICY "Anyone can view lesson quizzes" 
  ON lesson_quizzes FOR SELECT 
  USING (true);

CREATE POLICY "Instructors can manage quizzes for their lessons" 
  ON lesson_quizzes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM lessons 
      JOIN courses ON lessons.course_id = courses.id 
      WHERE lessons.id = lesson_quizzes.lesson_id 
      AND courses.instructor_id = auth.uid()::text
    )
  );

-- Policies for student_quiz_attempts
CREATE POLICY "Students can view their own quiz attempts" 
  ON student_quiz_attempts FOR SELECT 
  USING (student_id = auth.uid()::text);

CREATE POLICY "Students can create their own quiz attempts" 
  ON student_quiz_attempts FOR INSERT 
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "Students can update their own quiz attempts" 
  ON student_quiz_attempts FOR UPDATE 
  USING (student_id = auth.uid()::text);

-- Instructors can view quiz attempts for their lessons
CREATE POLICY "Instructors can view quiz attempts for their lessons" 
  ON student_quiz_attempts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM lessons 
      JOIN courses ON lessons.course_id = courses.id 
      WHERE lessons.id = student_quiz_attempts.lesson_id 
      AND courses.instructor_id = auth.uid()::text
    )
  );