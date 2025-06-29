/*
  # Learning Paths Schema

  1. New Tables
    - `learning_paths`
      - `id` (serial, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `difficulty` (text)
      - `estimated_duration` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `learning_path_courses`
      - `id` (serial, primary key)
      - `learning_path_id` (integer, foreign key)
      - `course_id` (integer, foreign key)
      - `course_order` (integer)
      - `created_at` (timestamptz)
    
    - `learning_path_enrollments`
      - `id` (serial, primary key)
      - `student_id` (text)
      - `learning_path_id` (integer, foreign key)
      - `enrolled_at` (timestamptz)
      - `progress` (integer, default 0)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  estimated_duration TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning_path_courses table
CREATE TABLE IF NOT EXISTS learning_path_courses (
  id SERIAL PRIMARY KEY,
  learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learning_path_id, course_id),
  UNIQUE(learning_path_id, course_order)
);

-- Create learning_path_enrollments table
CREATE TABLE IF NOT EXISTS learning_path_enrollments (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, learning_path_id)
);

-- Enable RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for learning_paths (public read)
CREATE POLICY "Anyone can view learning paths" ON learning_paths FOR SELECT USING (true);

-- Policies for learning_path_courses (public read)
CREATE POLICY "Anyone can view learning path courses" ON learning_path_courses FOR SELECT USING (true);

-- Policies for learning_path_enrollments (students can manage their own)
CREATE POLICY "Students can view their path enrollments" ON learning_path_enrollments FOR SELECT USING (student_id = auth.uid()::text);
CREATE POLICY "Students can create path enrollments" ON learning_path_enrollments FOR INSERT WITH CHECK (student_id = auth.uid()::text);
CREATE POLICY "Students can update their path enrollments" ON learning_path_enrollments FOR UPDATE USING (student_id = auth.uid()::text);

-- Insert prebuilt learning paths
INSERT INTO learning_paths (title, description, category, difficulty, estimated_duration, image_url) VALUES
('Complete Web Development Bootcamp', 'Master full-stack web development from HTML/CSS to advanced frameworks and deployment. Build real-world projects and become job-ready.', 'technology', 'beginner', '6 months', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Data Science Mastery', 'Comprehensive data science curriculum covering statistics, Python, machine learning, and data visualization. Perfect for career transition.', 'technology', 'intermediate', '8 months', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Mathematics for Engineers', 'Complete mathematical foundation for engineering students covering calculus, linear algebra, differential equations, and applied mathematics.', 'mathematics', 'intermediate', '4 months', 'https://images.pexels.com/photos/6256/mathematics-number-cube-school.jpg?auto=compress&cs=tinysrgb&w=800'),
('Digital Marketing Professional', 'Become a digital marketing expert with courses on SEO, social media, content marketing, analytics, and paid advertising.', 'business', 'beginner', '3 months', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Creative Arts & Design', 'Explore your creative potential with courses in digital art, graphic design, photography, and creative writing.', 'arts', 'beginner', '5 months', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Business Leadership & Management', 'Develop essential leadership skills, project management expertise, and business strategy knowledge for career advancement.', 'business', 'intermediate', '4 months', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Health & Wellness Specialist', 'Comprehensive health education covering nutrition, fitness, mental health, and wellness coaching fundamentals.', 'health', 'beginner', '3 months', 'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Artificial Intelligence & Machine Learning', 'Advanced AI/ML curriculum covering deep learning, neural networks, computer vision, and natural language processing.', 'technology', 'advanced', '10 months', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800');

-- Insert comprehensive courses for each learning path

-- Web Development Bootcamp Courses
INSERT INTO courses (title, description, instructor_id, instructor_name, price, category, difficulty, image_url) VALUES
('HTML & CSS Fundamentals', 'Master the building blocks of web development with comprehensive HTML and CSS training including responsive design and modern layouts.', 'system', 'Sarah Chen', 39.99, 'technology', 'beginner', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'),
('JavaScript Essentials', 'Learn JavaScript from basics to advanced concepts including ES6+, DOM manipulation, async programming, and modern JavaScript patterns.', 'system', 'Mike Rodriguez', 49.99, 'technology', 'beginner', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'),
('React Development', 'Build modern web applications with React including hooks, state management, routing, and component architecture best practices.', 'system', 'Emily Zhang', 59.99, 'technology', 'intermediate', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Node.js & Backend Development', 'Create robust backend applications with Node.js, Express, databases, authentication, and API development.', 'system', 'David Kim', 54.99, 'technology', 'intermediate', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Full-Stack Project & Deployment', 'Build and deploy complete full-stack applications using modern tools, cloud platforms, and DevOps practices.', 'system', 'Lisa Wang', 64.99, 'technology', 'intermediate', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'),

-- Data Science Mastery Courses
('Python for Data Science', 'Master Python programming specifically for data science including NumPy, Pandas, and data manipulation techniques.', 'system', 'Dr. Alex Thompson', 49.99, 'technology', 'beginner', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Statistics & Probability', 'Comprehensive statistics foundation covering descriptive statistics, probability theory, hypothesis testing, and statistical inference.', 'system', 'Prof. Maria Garcia', 44.99, 'mathematics', 'intermediate', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Data Visualization & Analysis', 'Create compelling data visualizations using matplotlib, seaborn, and plotly while learning exploratory data analysis techniques.', 'system', 'James Liu', 39.99, 'technology', 'intermediate', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Machine Learning Fundamentals', 'Learn supervised and unsupervised learning algorithms, model evaluation, and practical machine learning implementation.', 'system', 'Dr. Rachel Adams', 59.99, 'technology', 'intermediate', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Advanced ML & Deep Learning', 'Explore neural networks, deep learning frameworks, computer vision, and natural language processing applications.', 'system', 'Dr. Kevin Park', 69.99, 'technology', 'advanced', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800'),

-- Mathematics for Engineers Courses
('Calculus I: Limits & Derivatives', 'Master fundamental calculus concepts including limits, continuity, derivatives, and applications to engineering problems.', 'system', 'Dr. Robert Johnson', 49.99, 'mathematics', 'intermediate', 'https://images.pexels.com/photos/6256/mathematics-number-cube-school.jpg?auto=compress&cs=tinysrgb&w=800'),
('Calculus II: Integration & Series', 'Advanced calculus covering integration techniques, infinite series, parametric equations, and polar coordinates.', 'system', 'Dr. Robert Johnson', 49.99, 'mathematics', 'intermediate', 'https://images.pexels.com/photos/6256/mathematics-number-cube-school.jpg?auto=compress&cs=tinysrgb&w=800'),
('Linear Algebra for Engineers', 'Comprehensive linear algebra covering matrices, vector spaces, eigenvalues, and engineering applications.', 'system', 'Prof. Susan Miller', 44.99, 'mathematics', 'intermediate', 'https://images.pexels.com/photos/6256/mathematics-number-cube-school.jpg?auto=compress&cs=tinysrgb&w=800'),
('Differential Equations', 'Solve ordinary and partial differential equations with applications to engineering systems and modeling.', 'system', 'Dr. Thomas Brown', 54.99, 'mathematics', 'advanced', 'https://images.pexels.com/photos/6256/mathematics-number-cube-school.jpg?auto=compress&cs=tinysrgb&w=800'),

-- Digital Marketing Professional Courses
('SEO & Content Marketing', 'Master search engine optimization, keyword research, content strategy, and organic traffic generation techniques.', 'system', 'Jennifer Martinez', 39.99, 'business', 'beginner', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Social Media Marketing', 'Create effective social media strategies across platforms including Facebook, Instagram, LinkedIn, and TikTok marketing.', 'system', 'Carlos Rodriguez', 34.99, 'business', 'beginner', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Google Ads & PPC Marketing', 'Master paid advertising with Google Ads, Facebook Ads, and other PPC platforms for maximum ROI.', 'system', 'Amanda Foster', 49.99, 'business', 'intermediate', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Analytics & Data-Driven Marketing', 'Use Google Analytics, marketing automation, and data analysis to optimize marketing campaigns and measure success.', 'system', 'Ryan Cooper', 44.99, 'business', 'intermediate', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800'),

-- Creative Arts & Design Courses
('Digital Art Fundamentals', 'Learn digital art basics including drawing techniques, color theory, composition, and digital painting with industry-standard tools.', 'system', 'Maya Patel', 39.99, 'arts', 'beginner', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Graphic Design Principles', 'Master graphic design fundamentals including typography, layout design, branding, and visual communication principles.', 'system', 'Alex Turner', 44.99, 'arts', 'beginner', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Photography & Visual Storytelling', 'Develop photography skills including composition, lighting, post-processing, and visual storytelling techniques.', 'system', 'Sophie Williams', 49.99, 'arts', 'beginner', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Advanced Creative Writing', 'Enhance your writing skills across genres including fiction, non-fiction, poetry, and creative storytelling techniques.', 'system', 'Dr. Marcus Reed', 39.99, 'arts', 'intermediate', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),

-- Business Leadership & Management Courses
('Leadership Fundamentals', 'Develop essential leadership skills including team management, communication, decision-making, and conflict resolution.', 'system', 'Dr. Patricia Davis', 49.99, 'business', 'intermediate', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Project Management Professional', 'Master project management methodologies including Agile, Scrum, risk management, and project lifecycle management.', 'system', 'Michael Chang', 54.99, 'business', 'intermediate', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Strategic Business Planning', 'Learn strategic planning, market analysis, competitive strategy, and business model development for organizational success.', 'system', 'Dr. Laura Anderson', 59.99, 'business', 'intermediate', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Financial Management & Analysis', 'Understand financial statements, budgeting, investment analysis, and financial decision-making for business leaders.', 'system', 'Robert Taylor', 49.99, 'business', 'intermediate', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'),

-- Health & Wellness Specialist Courses
('Nutrition Science & Planning', 'Comprehensive nutrition education covering macronutrients, meal planning, dietary guidelines, and nutritional counseling.', 'system', 'Dr. Sarah Mitchell', 44.99, 'health', 'beginner', 'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Fitness & Exercise Science', 'Learn exercise physiology, workout programming, strength training, and cardiovascular fitness principles.', 'system', 'Jake Morrison', 39.99, 'health', 'beginner', 'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Mental Health & Wellness Coaching', 'Understand mental health fundamentals, stress management, mindfulness, and wellness coaching techniques.', 'system', 'Dr. Emma Thompson', 49.99, 'health', 'beginner', 'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800'),

-- AI & Machine Learning Courses
('AI Fundamentals & Ethics', 'Introduction to artificial intelligence concepts, machine learning basics, AI ethics, and societal implications.', 'system', 'Dr. Andrew Chen', 54.99, 'technology', 'intermediate', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Deep Learning & Neural Networks', 'Advanced neural network architectures including CNNs, RNNs, transformers, and deep learning frameworks.', 'system', 'Dr. Priya Sharma', 69.99, 'technology', 'advanced', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Computer Vision Applications', 'Implement computer vision solutions including image classification, object detection, and image processing techniques.', 'system', 'Dr. Mark Johnson', 64.99, 'technology', 'advanced', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Natural Language Processing', 'Build NLP applications including text analysis, sentiment analysis, chatbots, and language model implementation.', 'system', 'Dr. Lisa Zhang', 64.99, 'technology', 'advanced', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800'),
('AI Project & Deployment', 'Deploy AI models in production environments using cloud platforms, MLOps practices, and scalable architectures.', 'system', 'Dr. Kevin Liu', 74.99, 'technology', 'advanced', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800');

-- Link courses to learning paths
INSERT INTO learning_path_courses (learning_path_id, course_id, course_order) VALUES
-- Web Development Bootcamp (path_id: 1)
(1, (SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 1),
(1, (SELECT id FROM courses WHERE title = 'JavaScript Essentials'), 2),
(1, (SELECT id FROM courses WHERE title = 'React Development'), 3),
(1, (SELECT id FROM courses WHERE title = 'Node.js & Backend Development'), 4),
(1, (SELECT id FROM courses WHERE title = 'Full-Stack Project & Deployment'), 5),

-- Data Science Mastery (path_id: 2)
(2, (SELECT id FROM courses WHERE title = 'Python for Data Science'), 1),
(2, (SELECT id FROM courses WHERE title = 'Statistics & Probability'), 2),
(2, (SELECT id FROM courses WHERE title = 'Data Visualization & Analysis'), 3),
(2, (SELECT id FROM courses WHERE title = 'Machine Learning Fundamentals'), 4),
(2, (SELECT id FROM courses WHERE title = 'Advanced ML & Deep Learning'), 5),

-- Mathematics for Engineers (path_id: 3)
(3, (SELECT id FROM courses WHERE title = 'Calculus I: Limits & Derivatives'), 1),
(3, (SELECT id FROM courses WHERE title = 'Calculus II: Integration & Series'), 2),
(3, (SELECT id FROM courses WHERE title = 'Linear Algebra for Engineers'), 3),
(3, (SELECT id FROM courses WHERE title = 'Differential Equations'), 4),

-- Digital Marketing Professional (path_id: 4)
(4, (SELECT id FROM courses WHERE title = 'SEO & Content Marketing'), 1),
(4, (SELECT id FROM courses WHERE title = 'Social Media Marketing'), 2),
(4, (SELECT id FROM courses WHERE title = 'Google Ads & PPC Marketing'), 3),
(4, (SELECT id FROM courses WHERE title = 'Analytics & Data-Driven Marketing'), 4),

-- Creative Arts & Design (path_id: 5)
(5, (SELECT id FROM courses WHERE title = 'Digital Art Fundamentals'), 1),
(5, (SELECT id FROM courses WHERE title = 'Graphic Design Principles'), 2),
(5, (SELECT id FROM courses WHERE title = 'Photography & Visual Storytelling'), 3),
(5, (SELECT id FROM courses WHERE title = 'Advanced Creative Writing'), 4),

-- Business Leadership & Management (path_id: 6)
(6, (SELECT id FROM courses WHERE title = 'Leadership Fundamentals'), 1),
(6, (SELECT id FROM courses WHERE title = 'Project Management Professional'), 2),
(6, (SELECT id FROM courses WHERE title = 'Strategic Business Planning'), 3),
(6, (SELECT id FROM courses WHERE title = 'Financial Management & Analysis'), 4),

-- Health & Wellness Specialist (path_id: 7)
(7, (SELECT id FROM courses WHERE title = 'Nutrition Science & Planning'), 1),
(7, (SELECT id FROM courses WHERE title = 'Fitness & Exercise Science'), 2),
(7, (SELECT id FROM courses WHERE title = 'Mental Health & Wellness Coaching'), 3),

-- AI & Machine Learning (path_id: 8)
(8, (SELECT id FROM courses WHERE title = 'AI Fundamentals & Ethics'), 1),
(8, (SELECT id FROM courses WHERE title = 'Deep Learning & Neural Networks'), 2),
(8, (SELECT id FROM courses WHERE title = 'Computer Vision Applications'), 3),
(8, (SELECT id FROM courses WHERE title = 'Natural Language Processing'), 4),
(8, (SELECT id FROM courses WHERE title = 'AI Project & Deployment'), 5);