-- Add content_raw column to lessons table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'content_raw'
  ) THEN
    ALTER TABLE lessons ADD COLUMN content_raw text;
  END IF;
END $$;

-- Ensure module_order exists in modules table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'module_order'
  ) THEN
    ALTER TABLE modules ADD COLUMN module_order integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Ensure lesson_order exists in lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'lesson_order'
  ) THEN
    ALTER TABLE lessons ADD COLUMN lesson_order integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Create index on module_order
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(course_id, module_order);

-- Create index on lesson_order
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(module_id, lesson_order);