/*
  # Add segment tracking to progress tables

  1. Changes
    - Add last_completed_segment_index column to lesson_progress table
    - Add last_completed_segment_index column to personal_lesson_progress table
    
  2. Purpose
    - Enable tracking of which segments of a lesson have been completed
    - Allow resuming lessons from where the user left off
    - Support more granular progress tracking
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