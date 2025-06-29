/*
  # Add segment tracking for lesson progress

  1. New Columns
    - Add `last_completed_segment_index` to `lesson_progress` table
    - Add `last_completed_segment_index` to `personal_lesson_progress` table
    
  2. Changes
    - Both columns default to 0, indicating no segments completed
    - Both columns are of type integer
    
  3. Purpose
    - Track which segments of a lesson have been completed
    - Enable resuming lessons from where the user left off
*/

-- Add last_completed_segment_index to lesson_progress table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lesson_progress' AND column_name = 'last_completed_segment_index'
  ) THEN
    ALTER TABLE lesson_progress ADD COLUMN last_completed_segment_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add last_completed_segment_index to personal_lesson_progress table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personal_lesson_progress' AND column_name = 'last_completed_segment_index'
  ) THEN
    ALTER TABLE personal_lesson_progress ADD COLUMN last_completed_segment_index INTEGER DEFAULT 0;
  END IF;
END $$;