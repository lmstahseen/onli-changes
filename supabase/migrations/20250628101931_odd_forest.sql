-- Create personal_lesson_flashcards table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_lesson_flashcards') THEN
    CREATE TABLE personal_lesson_flashcards (
      id SERIAL PRIMARY KEY,
      personal_lesson_id INTEGER NOT NULL REFERENCES student_personal_lessons(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL,
      flashcards JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(personal_lesson_id, student_id)
    );
    
    -- Enable RLS
    ALTER TABLE personal_lesson_flashcards ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can view their own flashcards') THEN
    DROP POLICY "Students can view their own flashcards" ON personal_lesson_flashcards;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can create their own flashcards') THEN
    DROP POLICY "Students can create their own flashcards" ON personal_lesson_flashcards;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can update their own flashcards') THEN
    DROP POLICY "Students can update their own flashcards" ON personal_lesson_flashcards;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can delete their own flashcards') THEN
    DROP POLICY "Students can delete their own flashcards" ON personal_lesson_flashcards;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Students can view their own flashcards" 
  ON personal_lesson_flashcards FOR SELECT 
  USING (student_id = auth.uid()::text);

CREATE POLICY "Students can create their own flashcards" 
  ON personal_lesson_flashcards FOR INSERT 
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "Students can update their own flashcards" 
  ON personal_lesson_flashcards FOR UPDATE 
  USING (student_id = auth.uid()::text);

CREATE POLICY "Students can delete their own flashcards" 
  ON personal_lesson_flashcards FOR DELETE 
  USING (student_id = auth.uid()::text);