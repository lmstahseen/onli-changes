/*
  # Create student personal lesson progress table

  1. New Tables
    - `student_personal_lesson_progress`
      - `id` (integer, primary key)
      - `student_id` (text, foreign key to auth.users)
      - `personal_lesson_id` (integer, foreign key to student_personal_lessons)
      - `completed` (boolean, default false)
      - `completed_at` (timestamp)
      - `last_completed_segment_index` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `student_personal_lesson_progress` table
    - Add policies for students to manage their own progress

  3. Indexes
    - Unique index on (student_id, personal_lesson_id)
    - Index on student_id for performance
*/

CREATE TABLE IF NOT EXISTS student_personal_lesson_progress (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  personal_lesson_id INTEGER NOT NULL REFERENCES student_personal_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  last_completed_segment_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint to prevent duplicate progress records
ALTER TABLE student_personal_lesson_progress 
ADD CONSTRAINT student_personal_lesson_progress_student_id_personal_lesson_id_key 
UNIQUE (student_id, personal_lesson_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_personal_lesson_progress_student_id 
ON student_personal_lesson_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_student_personal_lesson_progress_lesson_id 
ON student_personal_lesson_progress(personal_lesson_id);

-- Enable RLS
ALTER TABLE student_personal_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can manage their own lesson progress"
  ON student_personal_lesson_progress
  FOR ALL
  TO authenticated
  USING (student_id = (uid())::text)
  WITH CHECK (student_id = (uid())::text);