/*
  # Personal Learning Paths Schema

  1. New Tables
    - `personal_learning_paths` - Stores AI-generated learning paths
    - `personal_path_modules` - Stores modules within learning paths
    - `personal_path_lessons` - Stores lessons within modules
    - `personal_lesson_progress` - Tracks student progress on lessons
    - `personal_path_quizzes` - Stores AI-generated quizzes for lessons
    - `personal_path_flashcards` - Stores AI-generated flashcards for lessons
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
  
  3. Indexes
    - Add performance indexes for common query patterns
*/

-- Create personal_learning_paths table
CREATE TABLE IF NOT EXISTS personal_learning_paths (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_topic TEXT NOT NULL,
  current_standing TEXT NOT NULL,
  exam_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_content_raw TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create personal_path_modules table
CREATE TABLE IF NOT EXISTS personal_path_modules (
  id SERIAL PRIMARY KEY,
  personal_learning_path_id INTEGER NOT NULL REFERENCES personal_learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  module_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create personal_path_lessons table
CREATE TABLE IF NOT EXISTS personal_path_lessons (
  id SERIAL PRIMARY KEY,
  personal_path_module_id INTEGER NOT NULL REFERENCES personal_path_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_script TEXT NOT NULL,
  duration TEXT NOT NULL,
  lesson_order INTEGER NOT NULL,
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create personal_lesson_progress table
CREATE TABLE IF NOT EXISTS personal_lesson_progress (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL,
  personal_path_lesson_id INTEGER NOT NULL REFERENCES personal_path_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  quiz_score INTEGER,
  flashcards_generated BOOLEAN DEFAULT false,
  UNIQUE(student_id, personal_path_lesson_id)
);

-- Create personal_path_quizzes table
CREATE TABLE IF NOT EXISTS personal_path_quizzes (
  id SERIAL PRIMARY KEY,
  personal_path_lesson_id INTEGER NOT NULL REFERENCES personal_path_lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(personal_path_lesson_id, student_id)
);

-- Create personal_path_flashcards table
CREATE TABLE IF NOT EXISTS personal_path_flashcards (
  id SERIAL PRIMARY KEY,
  personal_path_lesson_id INTEGER NOT NULL REFERENCES personal_path_lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  flashcards JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(personal_path_lesson_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE personal_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_path_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_path_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_path_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_path_flashcards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for personal_learning_paths
CREATE POLICY "Students can manage their own learning paths" 
  ON personal_learning_paths
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid()::uuid);

-- Create RLS policies for personal_path_modules
CREATE POLICY "Students can access modules in their learning paths" 
  ON personal_path_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personal_learning_paths
      WHERE personal_learning_paths.id = personal_path_modules.personal_learning_path_id
      AND personal_learning_paths.student_id = auth.uid()::uuid
    )
  );

-- Create RLS policies for personal_path_lessons
CREATE POLICY "Students can access lessons in their learning paths" 
  ON personal_path_lessons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personal_path_modules
      JOIN personal_learning_paths ON personal_learning_paths.id = personal_path_modules.personal_learning_path_id
      WHERE personal_path_modules.id = personal_path_lessons.personal_path_module_id
      AND personal_learning_paths.student_id = auth.uid()::uuid
    )
  );

-- Create RLS policies for personal_lesson_progress
CREATE POLICY "Students can manage their own lesson progress" 
  ON personal_lesson_progress
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid()::uuid);

-- Create RLS policies for personal_path_quizzes
CREATE POLICY "Students can access quizzes for their lessons" 
  ON personal_path_quizzes
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid()::uuid);

-- Create RLS policies for personal_path_flashcards
CREATE POLICY "Students can access flashcards for their lessons" 
  ON personal_path_flashcards
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid()::uuid);

-- Create indexes for performance
CREATE INDEX idx_personal_learning_paths_student_id ON personal_learning_paths(student_id);
CREATE INDEX idx_personal_path_modules_path_id ON personal_path_modules(personal_learning_path_id);
CREATE INDEX idx_personal_path_lessons_module_id ON personal_path_lessons(personal_path_module_id);
CREATE INDEX idx_personal_path_lessons_scheduled_date ON personal_path_lessons(scheduled_date);
CREATE INDEX idx_personal_lesson_progress_student_lesson ON personal_lesson_progress(student_id, personal_path_lesson_id);
CREATE INDEX idx_personal_path_quizzes_lesson_id ON personal_path_quizzes(personal_path_lesson_id);
CREATE INDEX idx_personal_path_flashcards_lesson_id ON personal_path_flashcards(personal_path_lesson_id);