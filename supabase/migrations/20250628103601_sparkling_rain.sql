/*
  # Module-Based Course Structure Migration

  1. New Tables
    - `modules`
      - `id` (serial, primary key)
      - `course_id` (integer, foreign key to courses)
      - `title` (text)
      - `description` (text)
      - `module_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to existing tables
    - Add `module_id` to `lessons` table
    - Remove `course_id` from `lessons` table (after migration)
    - Update all policies to work with the new structure

  3. Security
    - Enable RLS on modules table
    - Update lesson policies to work through modules
    - Update quiz and quiz attempt policies
*/

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  module_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Policies for modules
CREATE POLICY "Anyone can view modules" ON modules FOR SELECT USING (true);
CREATE POLICY "Instructors can manage modules for their courses" ON modules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = modules.course_id 
    AND courses.instructor_id = auth.uid()::text
  )
);

-- Add module_id column to lessons table (nullable for now)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id INTEGER;

-- Create default modules for existing courses that have lessons
INSERT INTO modules (course_id, title, description, module_order)
SELECT DISTINCT course_id, 'Module 1', 'Default module created during migration', 1
FROM lessons
WHERE course_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update lessons to reference the default modules
UPDATE lessons
SET module_id = modules.id
FROM modules
WHERE lessons.course_id = modules.course_id
AND lessons.module_id IS NULL;

-- Drop all dependent policies first
DROP POLICY IF EXISTS "Instructors can manage lessons for their courses" ON lessons;
DROP POLICY IF EXISTS "Instructors can manage quizzes for their lessons" ON lesson_quizzes;
DROP POLICY IF EXISTS "Instructors can view quiz attempts for their lessons" ON student_quiz_attempts;

-- Make module_id required and add foreign key constraint
ALTER TABLE lessons 
  ALTER COLUMN module_id SET NOT NULL,
  ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

-- Now we can safely drop the course_id column
ALTER TABLE lessons DROP COLUMN IF EXISTS course_id;

-- Recreate lesson policies to work with modules
CREATE POLICY "Instructors can manage lessons for their modules" ON lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON modules.course_id = courses.id
    WHERE modules.id = lessons.module_id
    AND courses.instructor_id = auth.uid()::text
  )
);

-- Recreate quiz policies to work with modules
CREATE POLICY "Instructors can manage quizzes for their lessons" ON lesson_quizzes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM lessons
    JOIN modules ON lessons.module_id = modules.id
    JOIN courses ON modules.course_id = courses.id
    WHERE lessons.id = lesson_quizzes.lesson_id
    AND courses.instructor_id = auth.uid()::text
  )
);

-- Recreate quiz attempt policies to work with modules
CREATE POLICY "Instructors can view quiz attempts for their lessons" ON student_quiz_attempts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lessons
    JOIN modules ON lessons.module_id = modules.id
    JOIN courses ON modules.course_id = courses.id
    WHERE lessons.id = student_quiz_attempts.lesson_id
    AND courses.instructor_id = auth.uid()::text
  )
);

-- Update lesson_progress policies if needed (they should still work since they reference lesson_id)
-- No changes needed for lesson_progress policies as they only reference lesson_id

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_order ON modules(course_id, module_order);