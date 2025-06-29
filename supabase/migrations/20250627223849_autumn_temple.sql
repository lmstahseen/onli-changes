/*
  # Add content_raw column to lessons table

  1. Changes
    - Add `content_raw` column to `lessons` table to store raw lesson content
    - This column will store the original content before AI processing

  2. Security
    - No changes to RLS policies needed
*/

-- Add content_raw column to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'content_raw'
  ) THEN
    ALTER TABLE lessons ADD COLUMN content_raw TEXT;
  END IF;
END $$;