/*
  # Complete Database Schema for Onliversity Platform

  1. New Tables
    - `courses`
      - `id` (serial, primary key)
      - `title` (text)
      - `description` (text)
      - `instructor_id` (text)
      - `instructor_name` (text)
      - `price` (decimal)
      - `category` (text)
      - `difficulty` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `lessons`
      - `id` (serial, primary key)
      - `course_id` (integer, foreign key)
      - `title` (text)
      - `lesson_order` (integer)
      - `lesson_script` (text)
      - `duration` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `enrollments`
      - `id` (serial, primary key)
      - `student_id` (text)
      - `course_id` (integer, foreign key)
      - `enrolled_at` (timestamptz)
      - `progress` (integer)
    
    - `lesson_progress`
      - `id` (serial, primary key)
      - `student_id` (text)
      - `lesson_id` (integer, foreign key)
      - `completed` (boolean)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Students can only access their own data
    - Instructors can manage their own courses
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor_id TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_order INTEGER NOT NULL,
  lesson_script TEXT NOT NULL,
  duration TEXT DEFAULT '30 mins',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(student_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Policies for courses (public read, instructor write)
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Instructors can manage their courses" ON courses FOR ALL USING (instructor_id = auth.uid()::text);

-- Policies for lessons (public read, instructor write)
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Instructors can manage lessons for their courses" ON lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()::text
  )
);

-- Policies for enrollments (students can view their own)
CREATE POLICY "Students can view their enrollments" ON enrollments FOR SELECT USING (student_id = auth.uid()::text);
CREATE POLICY "Students can create enrollments" ON enrollments FOR INSERT WITH CHECK (student_id = auth.uid()::text);

-- Policies for lesson_progress (students can manage their own)
CREATE POLICY "Students can view their progress" ON lesson_progress FOR SELECT USING (student_id = auth.uid()::text);
CREATE POLICY "Students can update their progress" ON lesson_progress FOR ALL USING (student_id = auth.uid()::text);

-- Insert sample data
INSERT INTO courses (title, description, instructor_id, instructor_name, price, category, difficulty, image_url) VALUES
('Mathematics 101', 'A comprehensive introduction to fundamental mathematical concepts including algebra, geometry, and basic calculus. This course is designed to build a solid foundation for advanced mathematical studies.', '2', 'Dr. Sarah Johnson', 49.99, 'mathematics', 'beginner', 'https://images.pexels.com/photos/6256/mathematics-number-cube-school.jpg?auto=compress&cs=tinysrgb&w=800'),
('Introduction to Physics', 'Explore the fundamental principles of physics including mechanics, thermodynamics, and electromagnetism. Perfect for students beginning their journey in physical sciences.', '2', 'Prof. Michael Chen', 59.99, 'science', 'intermediate', 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=800'),
('History of Art', 'Journey through the evolution of art from ancient civilizations to modern times. Discover the cultural and historical contexts that shaped artistic movements.', '2', 'Dr. Emily Davis', 39.99, 'arts', 'beginner', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Creative Writing Workshop', 'Develop your creative writing skills through practical exercises, peer feedback, and expert guidance. Learn various forms of creative expression.', '2', 'Prof. Robert Wilson', 44.99, 'arts', 'intermediate', 'https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Digital Marketing Fundamentals', 'Master the essentials of digital marketing including SEO, social media marketing, content strategy, and analytics for business growth.', '2', 'Sarah Thompson', 54.99, 'business', 'beginner', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800');

-- Insert sample lessons for Mathematics 101 (course_id = 1)
INSERT INTO lessons (course_id, title, lesson_order, lesson_script, duration) VALUES
(1, 'Introduction to Algebra', 1, 'Welcome to our comprehensive introduction to algebra! In this lesson, we will explore the fundamental concepts that form the foundation of algebraic thinking.

Algebra is a branch of mathematics that uses symbols, typically letters, to represent numbers in equations and expressions. These symbols allow us to work with unknown quantities and establish relationships between different mathematical elements.

Key Topics We will Cover:

1. Variables and Constants
Variables are symbols (usually letters like x, y, or z) that represent unknown or changing values. Constants are fixed numbers that do not change.

2. Algebraic Expressions
An algebraic expression is a mathematical phrase that contains variables, constants, and operations. For example: 3x + 5, 2y - 7, or 4a squared + 3b.

3. Equations vs. Expressions
An equation states that two expressions are equal (contains an equals sign), while an expression is just a mathematical phrase without an equals sign.

4. Basic Operations
We can add, subtract, multiply, and divide algebraic expressions following specific rules and properties.

5. Solving Simple Equations
The goal is to find the value of the variable that makes the equation true. We do this by performing the same operations on both sides of the equation.

Let us start with a simple example:
If x + 3 = 7, what is the value of x?

To solve this, we subtract 3 from both sides:
x + 3 - 3 = 7 - 3
x = 4

We can verify our answer by substituting x = 4 back into the original equation:
4 + 3 = 7 (checkmark)

This process of isolating the variable is fundamental to algebra and will be used throughout your mathematical journey.

Practice Problems:
Try solving these on your own:
1. x + 5 = 12
2. y - 3 = 8
3. 2z = 14

Remember, the key to mastering algebra is practice and understanding the underlying principles rather than just memorizing procedures.', '45 mins'),

(1, 'Linear Equations', 2, 'Welcome to our lesson on linear equations! Building on our introduction to algebra, we will now dive deeper into one of the most important concepts in mathematics.

A linear equation is an equation that makes a straight line when graphed. It has the general form y = mx + b, where m is the slope and b is the y-intercept.

Understanding Linear Equations:

1. What Makes an Equation Linear?
- The variable appears only to the first power (no x squared, x cubed, etc.)
- The graph forms a straight line
- There are no products of variables (like xy)

2. Standard Forms of Linear Equations
- Slope-intercept form: y = mx + b
- Point-slope form: y - y1 = m(x - x1)
- Standard form: Ax + By = C

3. Finding Solutions
A solution to a linear equation is any pair of values (x, y) that makes the equation true.

4. Graphing Linear Equations
To graph a linear equation:
- Find the y-intercept (where the line crosses the y-axis)
- Use the slope to find additional points
- Draw a straight line through the points

5. Real-World Applications
Linear equations model many real-world situations:
- Distance and time relationships
- Cost and quantity relationships
- Temperature conversions

Example Problem:
Graph the equation y = 2x + 3

Step 1: Identify the slope (m = 2) and y-intercept (b = 3)
Step 2: Plot the y-intercept at (0, 3)
Step 3: Use the slope to find another point: from (0, 3), go up 2 and right 1 to get (1, 5)
Step 4: Draw a line through these points

Practice Exercises:
1. Graph y = -x + 4
2. Find the equation of a line with slope 3 passing through (2, 1)
3. Determine if (4, 7) is a solution to y = 2x - 1

Linear equations are everywhere in mathematics and science. Mastering them opens doors to understanding more complex mathematical concepts.', '60 mins'),

(1, 'Quadratic Functions', 3, 'Welcome to our exploration of quadratic functions! This lesson will introduce you to one of the most important types of functions in mathematics.

A quadratic function is a polynomial function of degree 2, typically written in the form f(x) = ax squared + bx + c, where a is not equal to 0.

Key Characteristics of Quadratic Functions:

1. Standard Form: f(x) = ax squared + bx + c
- a determines the direction and width of the parabola
- b affects the position of the vertex
- c is the y-intercept

2. The Graph: A Parabola
- If a > 0, the parabola opens upward
- If a < 0, the parabola opens downward
- The vertex is the highest or lowest point

3. Finding the Vertex
The vertex occurs at x = -b/(2a)
The y-coordinate is found by substituting this x-value into the function

4. The Axis of Symmetry
The vertical line x = -b/(2a) divides the parabola into two mirror images

5. Roots or Zeros
These are the x-values where f(x) = 0
Found using factoring, completing the square, or the quadratic formula

6. The Quadratic Formula
For ax squared + bx + c = 0:
x = (-b plus or minus square root of (b squared - 4ac)) / (2a)

The discriminant (b squared - 4ac) tells us:
- If positive: two real roots
- If zero: one real root (repeated)
- If negative: no real roots

Real-World Applications:
- Projectile motion (height vs. time)
- Profit maximization in business
- Area optimization problems
- Engineering and physics calculations

Example Problem:
Find the vertex and roots of f(x) = x squared - 4x + 3

Vertex: x = -(-4)/(2 times 1) = 2
f(2) = 4 - 8 + 3 = -1
Vertex: (2, -1)

Roots: x squared - 4x + 3 = 0
(x - 1)(x - 3) = 0
x = 1 or x = 3

Practice Problems:
1. Find the vertex of f(x) = 2x squared + 8x + 5
2. Solve x squared - 6x + 9 = 0
3. A ball is thrown upward with initial velocity 32 ft/s from a height of 6 feet. Its height is given by h(t) = -16t squared + 32t + 6. When does it hit the ground?

Understanding quadratic functions is crucial for advanced mathematics, physics, and engineering applications.', '55 mins'),

(1, 'Geometry Fundamentals', 4, 'Welcome to the fascinating world of geometry! In this lesson, we will explore the basic concepts that form the foundation of geometric thinking.

Geometry is the branch of mathematics that deals with shapes, sizes, positions, and properties of space. It is one of the oldest mathematical sciences.

Basic Geometric Elements:

1. Points, Lines, and Planes
- Point: A location with no dimension (represented by a dot)
- Line: Extends infinitely in both directions
- Line segment: Part of a line with two endpoints
- Ray: Part of a line with one endpoint, extending infinitely in one direction
- Plane: A flat surface extending infinitely in all directions

2. Angles
- Formed by two rays sharing a common endpoint (vertex)
- Measured in degrees or radians
- Types: acute (< 90 degrees), right (90 degrees), obtuse (> 90 degrees), straight (180 degrees)

3. Triangles
- Three-sided polygons
- Types by sides: equilateral, isosceles, scalene
- Types by angles: acute, right, obtuse
- Triangle inequality: sum of any two sides > third side

4. Quadrilaterals
- Four-sided polygons
- Types: square, rectangle, rhombus, parallelogram, trapezoid
- Properties vary based on parallel sides and equal angles

5. Circles
- Set of all points equidistant from a center point
- Radius: distance from center to any point on circle
- Diameter: distance across circle through center
- Circumference: distance around the circle

Important Formulas:

Triangle Area: A = (1/2) times base times height
Rectangle Area: A = length times width
Circle Area: A = pi times r squared
Circle Circumference: C = 2 times pi times r

Pythagorean Theorem:
In a right triangle: a squared + b squared = c squared
where c is the hypotenuse

Geometric Reasoning:

1. Congruence
- Figures with same size and shape
- Symbol: congruent

2. Similarity
- Figures with same shape but different size
- Symbol: similar

3. Parallel and Perpendicular Lines
- Parallel lines never intersect
- Perpendicular lines intersect at 90 degrees

Real-World Applications:
- Architecture and construction
- Art and design
- Navigation and GPS
- Computer graphics
- Engineering

Example Problem:
Find the area of a triangle with base 8 cm and height 6 cm.

Solution:
A = (1/2) times base times height
A = (1/2) times 8 times 6
A = 24 cm squared

Practice Exercises:
1. Find the circumference of a circle with radius 5 inches
2. In a right triangle, if one leg is 3 units and the hypotenuse is 5 units, find the other leg
3. Calculate the area of a rectangle with length 12 feet and width 8 feet

Geometry helps us understand the world around us and provides tools for solving practical problems in many fields.', '50 mins'),

(1, 'Triangles and Polygons', 5, 'Welcome to our detailed exploration of triangles and polygons! These fundamental geometric shapes are building blocks for understanding more complex geometric concepts.

Triangles - The Foundation of Geometry:

1. Classification by Sides:
- Equilateral: All three sides equal, all angles 60 degrees
- Isosceles: Two sides equal, two angles equal
- Scalene: All sides different, all angles different

2. Classification by Angles:
- Acute: All angles less than 90 degrees
- Right: One angle exactly 90 degrees
- Obtuse: One angle greater than 90 degrees

3. Triangle Properties:
- Sum of interior angles = 180 degrees
- Exterior angle = sum of two non-adjacent interior angles
- Triangle inequality: sum of any two sides > third side

4. Special Right Triangles:
- 45-45-90 triangle: sides in ratio 1:1:square root of 2
- 30-60-90 triangle: sides in ratio 1:square root of 3:2

5. Triangle Congruence:
- SSS (Side-Side-Side)
- SAS (Side-Angle-Side)
- ASA (Angle-Side-Angle)
- AAS (Angle-Angle-Side)
- HL (Hypotenuse-Leg for right triangles)

Polygons - Multi-sided Figures:

1. Definition and Classification:
- Polygon: closed figure with straight sides
- Regular polygon: all sides and angles equal
- Irregular polygon: sides and/or angles not equal

2. Common Polygons:
- Triangle (3 sides)
- Quadrilateral (4 sides)
- Pentagon (5 sides)
- Hexagon (6 sides)
- Octagon (8 sides)
- Decagon (10 sides)

3. Interior Angle Sum:
For an n-sided polygon: (n - 2) times 180 degrees

4. Exterior Angle Sum:
Always 360 degrees for any polygon

5. Special Quadrilaterals:
- Square: 4 equal sides, 4 right angles
- Rectangle: opposite sides equal, 4 right angles
- Rhombus: 4 equal sides, opposite angles equal
- Parallelogram: opposite sides parallel and equal
- Trapezoid: one pair of parallel sides

Area Formulas:

Triangle: A = (1/2)bh
Square: A = s squared
Rectangle: A = lw
Parallelogram: A = bh
Trapezoid: A = (1/2)(b1 + b2)h
Regular polygon: A = (1/2)ap (where a = apothem, p = perimeter)

Practical Applications:

1. Architecture and Construction:
- Roof trusses use triangular frameworks
- Floor plans utilize various polygonal shapes

2. Art and Design:
- Tessellations and patterns
- Logo design and graphics

3. Engineering:
- Structural analysis
- Bridge design

Example Problems:

1. Find the third angle of a triangle if two angles are 45 degrees and 70 degrees.
Solution: 180 degrees - 45 degrees - 70 degrees = 65 degrees

2. Calculate the interior angle sum of a hexagon.
Solution: (6 - 2) times 180 degrees = 720 degrees

3. Find the area of a parallelogram with base 10 cm and height 6 cm.
Solution: A = bh = 10 times 6 = 60 cm squared

Practice Exercises:
1. Classify a triangle with sides 5, 5, and 8 units
2. Find the measure of each interior angle of a regular octagon
3. Calculate the area of a trapezoid with parallel sides 8 and 12 units and height 5 units

Understanding triangles and polygons is essential for advanced geometry, trigonometry, and real-world problem solving.', '40 mins'),

(1, 'Introduction to Calculus', 6, 'Welcome to the exciting world of calculus! This lesson introduces you to one of the most powerful and beautiful areas of mathematics.

Calculus is the mathematical study of continuous change. It has two main branches: differential calculus (dealing with rates of change) and integral calculus (dealing with accumulation of quantities).

Historical Context:
Calculus was developed independently by Isaac Newton and Gottfried Leibniz in the 17th century. It revolutionized mathematics, physics, and engineering.

Key Concepts in Calculus:

1. Limits - The Foundation:
A limit describes the behavior of a function as the input approaches a particular value.

Notation: limit as x approaches a of f(x) = L

This means as x gets arbitrarily close to a, f(x) gets arbitrarily close to L.

2. Continuity:
A function is continuous at a point if:
- The function is defined at that point
- The limit exists at that point
- The limit equals the function value

3. The Derivative - Rate of Change:
The derivative measures how fast a function is changing at any point.

Definition: f prime of x = limit as h approaches 0 of [f(x+h) - f(x)]/h

Geometric interpretation: slope of the tangent line
Physical interpretation: instantaneous rate of change

4. Basic Differentiation Rules:
- Power rule: d/dx(x to the n) = n times x to the (n-1)
- Constant rule: d/dx(c) = 0
- Sum rule: d/dx[f(x) + g(x)] = f prime of x + g prime of x
- Product rule: d/dx[f(x)g(x)] = f prime of x times g(x) + f(x) times g prime of x

5. Applications of Derivatives:
- Finding maximum and minimum values
- Analyzing motion (velocity and acceleration)
- Optimization problems
- Related rates

6. The Integral - Accumulation:
Integration is the reverse process of differentiation.

Indefinite integral: integral of f(x)dx = F(x) + C
where F prime of x = f(x)

Definite integral: integral from a to b of f(x)dx
represents the area under the curve from x = a to x = b

7. Fundamental Theorem of Calculus:
This theorem connects differentiation and integration:
If F(x) = integral from a to x of f(t)dt, then F prime of x = f(x)

Real-World Applications:

1. Physics:
- Motion analysis (position, velocity, acceleration)
- Work and energy calculations
- Electric and magnetic fields

2. Engineering:
- Optimization of designs
- Signal processing
- Control systems

3. Economics:
- Marginal cost and revenue
- Optimization of profit
- Economic modeling

4. Biology and Medicine:
- Population growth models
- Drug concentration in bloodstream
- Epidemiological models

Example Problems:

1. Find the derivative of f(x) = 3x squared + 2x - 1
Solution: f prime of x = 6x + 2

2. Find the limit: limit as x approaches 2 of (x squared - 4)/(x - 2)
Solution: Factor and simplify: limit as x approaches 2 of (x + 2) = 4

3. A ball is thrown upward with position s(t) = -16t squared + 64t + 6
Find the velocity at t = 2 seconds.
Solution: v(t) = s prime of t = -32t + 64
v(2) = -32(2) + 64 = 0 ft/s

Practice Exercises:
1. Find the derivative of y = x cubed - 5x squared + 7x - 2
2. Evaluate limit as x approaches 3 of (x squared - 9)/(x - 3)
3. If the position of an object is given by s(t) = t cubed - 6t squared + 9t, find when the velocity is zero

Calculus opens doors to advanced mathematics and provides powerful tools for understanding the natural world. It is essential for physics, engineering, economics, and many other fields.', '65 mins'),

(1, 'Derivatives Basics', 7, 'Welcome to our comprehensive exploration of derivatives! This lesson will deepen your understanding of one of calculus most important concepts.

The derivative represents the instantaneous rate of change of a function. It tells us how quickly a function is changing at any given point.

Understanding Derivatives:

1. Geometric Interpretation:
The derivative at a point is the slope of the tangent line to the curve at that point.

2. Physical Interpretation:
- Position leads to Velocity (first derivative)
- Velocity leads to Acceleration (second derivative)

3. The Derivative as a Limit:
f prime of x = limit as h approaches 0 of [f(x+h) - f(x)]/h

This limit, when it exists, gives us the instantaneous rate of change.

Differentiation Rules:

1. Power Rule:
If f(x) = x to the n, then f prime of x = n times x to the (n-1)

Examples:
- d/dx(x cubed) = 3x squared
- d/dx(x to the negative 2) = -2x to the negative 3
- d/dx(square root of x) = d/dx(x to the 1/2) = (1/2)x to the negative 1/2 = 1/(2 times square root of x)

2. Constant Rule:
If f(x) = c (constant), then f prime of x = 0

3. Constant Multiple Rule:
If f(x) = c times g(x), then f prime of x = c times g prime of x

4. Sum and Difference Rules:
d/dx[f(x) plus or minus g(x)] = f prime of x plus or minus g prime of x

5. Product Rule:
d/dx[f(x) times g(x)] = f prime of x times g(x) + f(x) times g prime of x

6. Quotient Rule:
d/dx[f(x)/g(x)] = [f prime of x times g(x) - f(x) times g prime of x]/[g(x) squared]

7. Chain Rule:
If y = f(g(x)), then dy/dx = f prime of g(x) times g prime of x

Higher-Order Derivatives:

1. Second Derivative: f double prime of x or d squared y/dx squared
- Measures the rate of change of the first derivative
- Indicates concavity of the function

2. Third Derivative: f triple prime of x or d cubed y/dx cubed
- Rate of change of the second derivative

Applications of Derivatives:

1. Finding Critical Points:
Set f prime of x = 0 and solve for x

2. Determining Increasing/Decreasing Intervals:
- f prime of x > 0: function is increasing
- f prime of x < 0: function is decreasing

3. Concavity Analysis:
- f double prime of x > 0: function is concave up
- f double prime of x < 0: function is concave down

4. Optimization Problems:
Find maximum and minimum values using derivatives

5. Related Rates:
Problems involving rates of change of related quantities

Example Problems:

1. Find the derivative of f(x) = 4x cubed - 6x squared + 2x - 5
Solution:
f prime of x = 12x squared - 12x + 2

2. Use the product rule to find the derivative of f(x) = (2x + 1)(x squared - 3)
Solution:
f prime of x = 2(x squared - 3) + (2x + 1)(2x)
f prime of x = 2x squared - 6 + 4x squared + 2x
f prime of x = 6x squared + 2x - 6

3. Find the equation of the tangent line to y = x squared at x = 3
Solution:
y prime of 3 = 2(3) = 6 (slope)
y(3) = 9 (point)
Tangent line: y - 9 = 6(x - 3) or y = 6x - 9

Real-World Applications:

1. Economics:
- Marginal cost = derivative of cost function
- Marginal revenue = derivative of revenue function

2. Physics:
- Velocity = derivative of position
- Acceleration = derivative of velocity

3. Biology:
- Population growth rates
- Reaction rates in chemistry

Practice Exercises:
1. Find f prime of x if f(x) = 3x to the 4th - 2x cubed + x - 7
2. Use the quotient rule to find the derivative of g(x) = (x squared + 1)/(x - 2)
3. A particle moves along a line with position s(t) = t cubed - 6t squared + 9t. Find when the particle is at rest.

Mastering derivatives is crucial for understanding calculus and its applications in science, engineering, and economics.', '70 mins'),

(1, 'Final Assessment', 8, 'Welcome to the final assessment for Mathematics 101! This comprehensive evaluation will test your understanding of all the concepts we have covered throughout the course.

Assessment Overview:
This final assessment consists of multiple sections covering each major topic from our course. Take your time and show all your work for partial credit.

Section 1: Algebra Fundamentals (25 points)

1. Solve for x: 3x + 7 = 22
2. Simplify: 2(x + 3) - 4(x - 1)
3. Factor completely: x squared - 9x + 20
4. Solve the system of equations:
   2x + y = 7
   x - y = 2

Section 2: Linear Equations (20 points)

5. Find the slope and y-intercept of the line: 4x - 2y = 8
6. Write the equation of a line passing through (2, -3) with slope -1/2
7. Graph the inequality: y greater than or equal to 2x - 1
8. Determine if the lines y = 3x + 1 and y = 3x - 2 are parallel, perpendicular, or neither

Section 3: Quadratic Functions (25 points)

9. Find the vertex of the parabola: f(x) = x squared - 6x + 5
10. Solve using the quadratic formula: 2x squared - 5x - 3 = 0
11. A ball is thrown upward from a height of 4 feet with an initial velocity of 48 ft/s. The height function is h(t) = -16t squared + 48t + 4. Find:
    a) The maximum height reached
    b) When the ball hits the ground

Section 4: Geometry (20 points)

12. Find the area of a triangle with vertices at (0,0), (4,0), and (2,3)
13. In a right triangle, if one leg is 5 cm and the hypotenuse is 13 cm, find the length of the other leg
14. Calculate the area and circumference of a circle with radius 6 inches
15. Find the sum of interior angles of a regular decagon

Section 5: Introduction to Calculus (10 points)

16. Find the derivative of f(x) = 3x squared - 4x + 1
17. Evaluate the limit: limit as x approaches 2 of (x squared - 4)/(x - 2)

Problem-Solving Strategies:

1. Read each problem carefully
2. Identify what is given and what you need to find
3. Choose the appropriate method or formula
4. Show all steps in your solution
5. Check your answer when possible

Time Management Tips:
- Allocate approximately 2 hours for this assessment
- Start with problems you find easiest
- Return to challenging problems after completing others
- Leave time to review your answers

Grading Rubric:
- Correct answer with complete work: Full credit
- Correct method with minor errors: Partial credit
- Correct setup with calculation errors: Partial credit
- No work shown: Minimal credit even if answer is correct

Study Reminders:
Before beginning, review these key concepts:
- Order of operations
- Factoring techniques
- Graphing methods
- Geometric formulas
- Basic differentiation rules

Calculator Policy:
A scientific calculator is permitted for this assessment. Graphing calculators are allowed for verification but show algebraic work for full credit.

Academic Integrity:
This is an individual assessment. All work must be your own. Collaboration or use of unauthorized resources will result in a zero score.

Good luck! Remember that this assessment is designed to demonstrate your understanding of the mathematical concepts we have explored together. Take your time, think carefully, and apply the problem-solving strategies we have practiced throughout the course.

If you have questions during the assessment, please ask for clarification. You have learned a tremendous amount in this course, and this assessment is your opportunity to showcase that knowledge.

Begin when you are ready, and remember to show all your work clearly and organize your solutions logically.', '90 mins');

-- Insert sample enrollments for student with id '1'
INSERT INTO enrollments (student_id, course_id, progress) VALUES
('1', 1, 65),
('1', 2, 40),
('1', 3, 85);

-- Insert sample lesson progress for student with id '1'
INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at) VALUES
('1', 1, true, NOW() - INTERVAL '5 days'),
('1', 2, true, NOW() - INTERVAL '3 days'),
('1', 3, true, NOW() - INTERVAL '1 day'),
('1', 4, false, NULL),
('1', 5, false, NULL),
('1', 6, false, NULL),
('1', 7, false, NULL),
('1', 8, false, NULL);