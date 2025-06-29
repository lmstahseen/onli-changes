/*
  # Lesson Flashcards Schema

  1. New Tables
    - `lesson_flashcards`
      - `id` (serial, primary key)
      - `lesson_id` (integer, foreign key to lessons)
      - `flashcards` (jsonb, stores flashcard data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on the table
    - Add policies for proper access control
    - Teachers can manage flashcards for their lessons
    - Students can view flashcards for lessons they're enrolled in
*/

-- Create lesson_flashcards table
CREATE TABLE IF NOT EXISTS lesson_flashcards (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  flashcards JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Enable RLS
ALTER TABLE lesson_flashcards ENABLE ROW LEVEL SECURITY;

-- Policies for lesson_flashcards
CREATE POLICY "Anyone can view lesson flashcards" 
  ON lesson_flashcards FOR SELECT 
  USING (true);

CREATE POLICY "Instructors can manage flashcards for their lessons" 
  ON lesson_flashcards FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM lessons 
      JOIN modules ON lessons.module_id = modules.id
      JOIN courses ON modules.course_id = courses.id
      WHERE lessons.id = lesson_flashcards.lesson_id 
      AND courses.instructor_id = auth.uid()::text
    )
  );