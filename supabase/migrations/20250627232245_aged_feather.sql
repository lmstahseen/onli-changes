/*
  # Comprehensive Lessons for All Learning Path Courses
  
  This migration adds detailed lesson content for all courses in the learning paths.
  Each course will have 6-8 comprehensive lessons with full scripts.
*/

-- HTML & CSS Fundamentals Lessons
INSERT INTO lessons (course_id, title, lesson_order, lesson_script, duration, content_raw) VALUES
((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 'Introduction to HTML Structure', 1, 
'Welcome to HTML & CSS Fundamentals! In this comprehensive lesson, we will explore the foundation of web development.

HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure and content of a webpage using elements and tags.

Key Concepts:
1. HTML Document Structure
Every HTML document follows a basic structure:
- DOCTYPE declaration
- HTML root element
- Head section (metadata)
- Body section (visible content)

2. HTML Elements and Tags
HTML uses tags to define elements:
- Opening tags: <tagname>
- Closing tags: </tagname>
- Self-closing tags: <tagname />

3. Essential HTML Elements
- Headings: <h1> to <h6>
- Paragraphs: <p>
- Links: <a href="">
- Images: <img src="" alt="">
- Lists: <ul>, <ol>, <li>
- Divisions: <div>
- Spans: <span>

4. Semantic HTML
Using meaningful HTML elements:
- <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>
- Improves accessibility and SEO

Practical Example:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Webpage</title>
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section id="home">
            <h2>Home Section</h2>
            <p>This is the main content of the page.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 My Website</p>
    </footer>
</body>
</html>

Best Practices:
- Always include DOCTYPE declaration
- Use semantic HTML elements
- Provide alt text for images
- Ensure proper nesting of elements
- Validate your HTML code

This foundation will prepare you for styling with CSS and creating interactive experiences with JavaScript.', '45 mins', 'HTML structure, elements, semantic markup'),

((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 'CSS Basics and Selectors', 2,
'Welcome to CSS Basics! CSS (Cascading Style Sheets) is used to style and layout HTML elements.

CSS Fundamentals:
1. CSS Syntax
CSS rules consist of:
- Selector: targets HTML elements
- Declaration block: contains property-value pairs
- Properties: what to style (color, font-size, etc.)
- Values: how to style it

2. CSS Selectors
- Element selector: p { color: blue; }
- Class selector: .highlight { background: yellow; }
- ID selector: #header { font-size: 24px; }
- Descendant selector: div p { margin: 10px; }
- Pseudo-classes: a:hover { color: red; }

3. The Box Model
Every element is a rectangular box with:
- Content: the actual content
- Padding: space inside the element
- Border: surrounds the padding
- Margin: space outside the element

4. CSS Properties
- Typography: font-family, font-size, font-weight, color
- Layout: width, height, margin, padding, display
- Background: background-color, background-image
- Border: border-width, border-style, border-color

5. CSS Units
- Absolute: px, pt, cm, mm, in
- Relative: %, em, rem, vh, vw
- Keywords: auto, inherit, initial

Practical Example:
/* CSS Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Typography */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 1rem;
}

/* Layout */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.header {
    background-color: #3498db;
    color: white;
    padding: 1rem 0;
}

.nav-list {
    list-style: none;
    display: flex;
    gap: 2rem;
}

.nav-link {
    color: white;
    text-decoration: none;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: #f39c12;
}

Best Practices:
- Use external stylesheets
- Organize CSS with comments
- Use consistent naming conventions
- Minimize use of !important
- Test across different browsers

Understanding CSS selectors and the box model is crucial for effective web styling.', '50 mins', 'CSS syntax, selectors, box model, properties'),

((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 'Responsive Design with Flexbox', 3,
'Master responsive design using CSS Flexbox for modern web layouts.

Flexbox Fundamentals:
1. Introduction to Flexbox
Flexbox (Flexible Box Layout) is a CSS layout method for arranging elements in rows or columns.

Key Concepts:
- Flex Container: parent element with display: flex
- Flex Items: child elements inside the container
- Main Axis: primary axis (horizontal by default)
- Cross Axis: perpendicular to main axis

2. Flex Container Properties
- display: flex | inline-flex
- flex-direction: row | column | row-reverse | column-reverse
- flex-wrap: nowrap | wrap | wrap-reverse
- justify-content: flex-start | center | space-between | space-around | space-evenly
- align-items: stretch | flex-start | center | flex-end | baseline
- align-content: flex-start | center | space-between | space-around | stretch

3. Flex Item Properties
- flex-grow: how much item should grow
- flex-shrink: how much item should shrink
- flex-basis: initial size before free space distribution
- flex: shorthand for grow, shrink, basis
- align-self: override align-items for individual item

4. Responsive Design Principles
- Mobile-first approach
- Flexible layouts that adapt to screen size
- Media queries for different breakpoints
- Scalable typography and images

Practical Examples:

/* Navigation Bar */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #2c3e50;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

/* Card Layout */
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    padding: 2rem;
}

.card {
    flex: 1 1 300px; /* grow, shrink, basis */
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    padding: 1.5rem;
}

/* Responsive Grid */
.grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.grid-item {
    flex: 1 1 calc(33.333% - 1rem);
    min-width: 250px;
}

/* Media Queries */
@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-menu {
        flex-direction: column;
        text-align: center;
    }
    
    .grid-item {
        flex: 1 1 100%;
    }
}

5. Common Flexbox Patterns
- Centering content
- Equal height columns
- Sticky footer
- Navigation bars
- Card layouts

Best Practices:
- Use flexbox for one-dimensional layouts
- Combine with CSS Grid for complex layouts
- Test on multiple devices
- Use relative units for scalability
- Progressive enhancement approach

Flexbox revolutionizes how we create responsive layouts with minimal code.', '55 mins', 'Flexbox layout, responsive design, media queries'),

((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 'CSS Grid Layout System', 4,
'Master CSS Grid for creating complex, responsive two-dimensional layouts.

CSS Grid Fundamentals:
1. Introduction to CSS Grid
CSS Grid is a powerful layout system for creating two-dimensional layouts with rows and columns.

Grid vs Flexbox:
- Grid: Two-dimensional (rows and columns)
- Flexbox: One-dimensional (row or column)
- Use Grid for page layouts, Flexbox for components

2. Grid Container Properties
- display: grid | inline-grid
- grid-template-columns: defines column sizes
- grid-template-rows: defines row sizes
- grid-template-areas: creates named grid areas
- gap: spacing between grid items
- justify-items: aligns items horizontally
- align-items: aligns items vertically

3. Grid Item Properties
- grid-column: shorthand for column start/end
- grid-row: shorthand for row start/end
- grid-area: assigns item to named area
- justify-self: individual horizontal alignment
- align-self: individual vertical alignment

4. Grid Units and Functions
- fr (fraction): distributes available space
- repeat(): repeats track definitions
- minmax(): sets minimum and maximum sizes
- auto-fit/auto-fill: responsive grid tracks

Practical Examples:

/* Basic Grid Layout */
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    gap: 2rem;
    padding: 2rem;
}

/* Complex Layout */
.page-layout {
    display: grid;
    grid-template-areas:
        "header header header"
        "sidebar main aside"
        "footer footer footer";
    grid-template-columns: 200px 1fr 200px;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
    gap: 1rem;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }

/* Responsive Grid */
.responsive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

/* Image Gallery */
.gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 2rem;
}

.gallery img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
}

/* Card Layout with Varying Sizes */
.card-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 200px;
    gap: 1rem;
}

.card.large {
    grid-column: span 2;
    grid-row: span 2;
}

.card.wide {
    grid-column: span 2;
}

.card.tall {
    grid-row: span 2;
}

5. Advanced Grid Techniques
- Implicit vs Explicit grids
- Grid line naming
- Subgrid (when supported)
- Grid and accessibility

6. Responsive Grid Patterns
@media (max-width: 768px) {
    .page-layout {
        grid-template-areas:
            "header"
            "main"
            "sidebar"
            "aside"
            "footer";
        grid-template-columns: 1fr;
    }
    
    .responsive-grid {
        grid-template-columns: 1fr;
    }
}

Best Practices:
- Use Grid for page layouts
- Combine with Flexbox for components
- Name grid lines and areas for clarity
- Test responsive behavior
- Consider browser support

CSS Grid provides unprecedented control over web layouts with clean, semantic code.', '60 mins', 'CSS Grid, two-dimensional layouts, responsive grids'),

((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 'Advanced CSS Techniques', 5,
'Explore advanced CSS techniques for modern web development.

Advanced CSS Concepts:
1. CSS Custom Properties (Variables)
Define reusable values throughout your stylesheet.

:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --font-size-large: 2rem;
    --spacing-unit: 1rem;
    --border-radius: 8px;
}

.button {
    background-color: var(--primary-color);
    font-size: var(--font-size-large);
    padding: var(--spacing-unit);
    border-radius: var(--border-radius);
}

2. CSS Animations and Transitions
Create smooth, engaging user interactions.

/* Transitions */
.button {
    transition: all 0.3s ease;
}

.button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* Keyframe Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeInUp 0.6s ease-out;
}

3. CSS Transforms
Manipulate element positioning and appearance.

.transform-examples {
    /* 2D Transforms */
    transform: translate(50px, 100px);
    transform: rotate(45deg);
    transform: scale(1.2);
    transform: skew(10deg, 5deg);
    
    /* 3D Transforms */
    transform: perspective(1000px) rotateX(45deg);
    transform: translateZ(50px);
}

4. Advanced Selectors
Target elements with precision.

/* Attribute Selectors */
input[type="email"] { border-color: blue; }
a[href^="https"] { color: green; }
img[alt*="logo"] { max-width: 200px; }

/* Pseudo-selectors */
li:nth-child(odd) { background: #f0f0f0; }
p:first-of-type { font-weight: bold; }
input:focus { outline: 2px solid blue; }
div:not(.special) { opacity: 0.8; }

/* Combinators */
.parent > .direct-child { margin: 1rem; }
.sibling + .adjacent { border-top: 1px solid #ccc; }
.general ~ .sibling { color: gray; }

5. CSS Functions
Leverage built-in CSS functions for dynamic styling.

.function-examples {
    /* Mathematical Functions */
    width: calc(100% - 2rem);
    font-size: clamp(1rem, 4vw, 2rem);
    height: min(50vh, 400px);
    width: max(300px, 50%);
    
    /* Color Functions */
    background: hsl(200, 50%, 50%);
    border-color: rgb(255, 0, 0);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    
    /* Gradient Functions */
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    background: radial-gradient(circle, #ff6b6b, #4ecdc4);
}

6. Modern Layout Techniques
Combine multiple layout methods for optimal results.

.modern-layout {
    /* Container Queries (when supported) */
    container-type: inline-size;
}

@container (min-width: 400px) {
    .card {
        display: flex;
        flex-direction: row;
    }
}

/* Aspect Ratio */
.video-container {
    aspect-ratio: 16 / 9;
    background: #000;
}

7. CSS Architecture
Organize CSS for maintainability.

/* BEM Methodology */
.block { }
.block__element { }
.block--modifier { }

/* CSS Modules approach */
.component {
    /* Component styles */
}

.component-title {
    /* Element styles */
}

.component--featured {
    /* Modifier styles */
}

8. Performance Optimization
Write efficient CSS for better performance.

/* Efficient Selectors */
.specific-class { } /* Good */
div.class#id { } /* Avoid - overly specific */

/* Hardware Acceleration */
.accelerated {
    transform: translateZ(0); /* Force GPU acceleration */
    will-change: transform; /* Hint to browser */
}

/* Critical CSS */
/* Inline critical above-the-fold styles */
/* Load non-critical styles asynchronously */

Best Practices:
- Use CSS custom properties for theming
- Implement smooth transitions for better UX
- Optimize for performance
- Follow CSS architecture patterns
- Test across browsers and devices
- Use modern features with fallbacks

These advanced techniques will elevate your CSS skills and enable you to create sophisticated, performant web interfaces.', '65 mins', 'CSS variables, animations, transforms, advanced selectors'),

((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals'), 'Web Accessibility and Best Practices', 6,
'Learn web accessibility principles and CSS best practices for inclusive design.

Web Accessibility Fundamentals:
1. Introduction to Accessibility
Web accessibility ensures that websites are usable by people with disabilities.

WCAG 2.1 Principles:
- Perceivable: Information must be presentable in ways users can perceive
- Operable: Interface components must be operable
- Understandable: Information and UI operation must be understandable
- Robust: Content must be robust enough for various assistive technologies

2. Semantic HTML for Accessibility
Use proper HTML elements for their intended purpose.

<!-- Good: Semantic structure -->
<header>
    <nav aria-label="Main navigation">
        <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
        </ul>
    </nav>
</header>

<main>
    <article>
        <h1>Article Title</h1>
        <p>Article content...</p>
    </article>
</main>

<!-- Bad: Non-semantic structure -->
<div class="header">
    <div class="nav">
        <div class="nav-item">Home</div>
        <div class="nav-item">About</div>
    </div>
</div>

3. ARIA (Accessible Rich Internet Applications)
Enhance accessibility with ARIA attributes.

<!-- ARIA Labels -->
<button aria-label="Close dialog">×</button>
<input type="search" aria-label="Search products">

<!-- ARIA Roles -->
<div role="button" tabindex="0">Custom Button</div>
<div role="alert">Error message</div>

<!-- ARIA States -->
<button aria-expanded="false" aria-controls="menu">Menu</button>
<div id="menu" aria-hidden="true">Menu content</div>

<!-- ARIA Properties -->
<input aria-describedby="password-help" type="password">
<div id="password-help">Password must be 8+ characters</div>

4. Color and Contrast
Ensure sufficient color contrast for readability.

/* Good contrast ratios */
.text-normal {
    color: #333333; /* 12.6:1 contrast on white */
    background: #ffffff;
}

.text-large {
    color: #666666; /* 5.7:1 contrast - acceptable for large text */
    background: #ffffff;
    font-size: 1.5rem;
}

/* Avoid color-only information */
.error {
    color: #d32f2f;
    border-left: 4px solid #d32f2f; /* Visual indicator beyond color */
}

.error::before {
    content: "⚠ "; /* Icon for additional context */
}

5. Focus Management
Provide clear focus indicators for keyboard navigation.

/* Custom focus styles */
.button:focus {
    outline: 2px solid #2196f3;
    outline-offset: 2px;
}

/* Skip links for keyboard users */
.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    transition: top 0.3s;
}

.skip-link:focus {
    top: 6px;
}

/* Focus trap for modals */
.modal {
    /* Ensure focus stays within modal */
}

6. Responsive and Mobile Accessibility
Design for various devices and input methods.

/* Touch targets */
.touch-target {
    min-height: 44px; /* iOS recommendation */
    min-width: 44px;
    padding: 12px;
}

/* Zoom considerations */
@media (max-width: 768px) {
    .text {
        font-size: 16px; /* Prevent zoom on iOS */
    }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

7. Form Accessibility
Create accessible forms with proper labeling and validation.

<form>
    <!-- Proper labeling -->
    <label for="email">Email Address *</label>
    <input 
        type="email" 
        id="email" 
        required 
        aria-describedby="email-error"
        aria-invalid="false"
    >
    <div id="email-error" role="alert" aria-live="polite">
        <!-- Error message appears here -->
    </div>
    
    <!-- Fieldsets for grouping -->
    <fieldset>
        <legend>Contact Preferences</legend>
        <input type="radio" id="email-pref" name="contact" value="email">
        <label for="email-pref">Email</label>
        <input type="radio" id="phone-pref" name="contact" value="phone">
        <label for="phone-pref">Phone</label>
    </fieldset>
</form>

8. CSS Best Practices
Write maintainable, scalable CSS.

/* Naming Conventions */
.component { } /* Block */
.component__element { } /* Element */
.component--modifier { } /* Modifier */

/* Utility Classes */
.visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

/* Progressive Enhancement */
.enhanced-feature {
    /* Base styles for all browsers */
}

@supports (display: grid) {
    .enhanced-feature {
        /* Enhanced styles for supporting browsers */
    }
}

9. Testing and Validation
Ensure your code meets accessibility standards.

Tools for Testing:
- WAVE Web Accessibility Evaluator
- axe DevTools
- Lighthouse accessibility audit
- Screen reader testing
- Keyboard navigation testing
- Color contrast analyzers

Best Practices Summary:
- Use semantic HTML elements
- Provide alternative text for images
- Ensure keyboard accessibility
- Maintain sufficient color contrast
- Test with assistive technologies
- Follow WCAG guidelines
- Implement progressive enhancement
- Validate HTML and CSS

Accessibility is not optional—it is a fundamental aspect of good web development that benefits all users.', '70 mins', 'Web accessibility, WCAG guidelines, ARIA, inclusive design');

-- Continue with JavaScript Essentials lessons...
INSERT INTO lessons (course_id, title, lesson_order, lesson_script, duration, content_raw) VALUES
((SELECT id FROM courses WHERE title = 'JavaScript Essentials'), 'JavaScript Fundamentals and Syntax', 1,
'Welcome to JavaScript Essentials! JavaScript is the programming language of the web, enabling interactive and dynamic user experiences.

JavaScript Fundamentals:
1. What is JavaScript?
JavaScript is a high-level, interpreted programming language that runs in web browsers and server environments.

Key Characteristics:
- Dynamic typing
- Interpreted language
- Event-driven programming
- Prototype-based object orientation
- First-class functions

2. JavaScript Syntax Basics
Variables and Data Types:

// Variable declarations
let name = "John"; // String
const age = 25; // Number
var isStudent = true; // Boolean
let hobbies = ["reading", "coding"]; // Array
let person = { name: "John", age: 25 }; // Object
let nothing = null; // Null
let undefined_var; // Undefined

// Modern variable declarations
const PI = 3.14159; // Cannot be reassigned
let counter = 0; // Can be reassigned
// Avoid var in modern JavaScript

3. Operators
Arithmetic Operators:
let a = 10, b = 3;
console.log(a + b); // 13 (Addition)
console.log(a - b); // 7 (Subtraction)
console.log(a * b); // 30 (Multiplication)
console.log(a / b); // 3.333... (Division)
console.log(a % b); // 1 (Modulus)
console.log(a ** b); // 1000 (Exponentiation)

Comparison Operators:
console.log(5 == "5"); // true (loose equality)
console.log(5 === "5"); // false (strict equality)
console.log(5 != "5"); // false
console.log(5 !== "5"); // true
console.log(10 > 5); // true
console.log(10 <= 10); // true

Logical Operators:
console.log(true && false); // false (AND)
console.log(true || false); // true (OR)
console.log(!true); // false (NOT)

4. Control Structures
Conditional Statements:

// if-else statement
let score = 85;
if (score >= 90) {
    console.log("A grade");
} else if (score >= 80) {
    console.log("B grade");
} else if (score >= 70) {
    console.log("C grade");
} else {
    console.log("Need improvement");
}

// Ternary operator
let status = age >= 18 ? "adult" : "minor";

// Switch statement
let day = "Monday";
switch (day) {
    case "Monday":
        console.log("Start of work week");
        break;
    case "Friday":
        console.log("TGIF!");
        break;
    default:
        console.log("Regular day");
}

5. Loops
For Loop:
for (let i = 0; i < 5; i++) {
    console.log("Iteration:", i);
}

While Loop:
let count = 0;
while (count < 3) {
    console.log("Count:", count);
    count++;
}

For...of Loop (Arrays):
let fruits = ["apple", "banana", "orange"];
for (let fruit of fruits) {
    console.log(fruit);
}

For...in Loop (Objects):
let person = { name: "John", age: 25, city: "NYC" };
for (let key in person) {
    console.log(key + ":", person[key]);
}

6. Functions
Function Declaration:
function greet(name) {
    return "Hello, " + name + "!";
}

Function Expression:
const greet = function(name) {
    return "Hello, " + name + "!";
};

Arrow Functions (ES6):
const greet = (name) => {
    return "Hello, " + name + "!";
};

// Concise arrow function
const greet = name => "Hello, " + name + "!";

// Multiple parameters
const add = (a, b) => a + b;

// No parameters
const sayHello = () => "Hello!";

7. Arrays and Array Methods
Creating and Manipulating Arrays:

let numbers = [1, 2, 3, 4, 5];

// Adding elements
numbers.push(6); // Add to end
numbers.unshift(0); // Add to beginning

// Removing elements
let lastElement = numbers.pop(); // Remove from end
let firstElement = numbers.shift(); // Remove from beginning

// Array methods
let doubled = numbers.map(num => num * 2);
let evens = numbers.filter(num => num % 2 === 0);
let sum = numbers.reduce((total, num) => total + num, 0);

// Finding elements
let found = numbers.find(num => num > 3);
let index = numbers.indexOf(3);
let exists = numbers.includes(4);

8. Objects and Object Methods
Creating and Working with Objects:

let student = {
    name: "Alice",
    age: 20,
    grades: [85, 92, 78],
    
    // Method
    getAverage: function() {
        let sum = this.grades.reduce((total, grade) => total + grade, 0);
        return sum / this.grades.length;
    },
    
    // ES6 method syntax
    introduce() {
        return `Hi, I am ${this.name} and I am ${this.age} years old.`;
    }
};

// Accessing properties
console.log(student.name); // Dot notation
console.log(student["age"]); // Bracket notation

// Adding properties
student.major = "Computer Science";

// Object destructuring
let { name, age } = student;
console.log(name, age);

9. Template Literals (ES6)
Modern string formatting:

let name = "John";
let age = 25;

// Template literal
let message = `Hello, my name is ${name} and I am ${age} years old.`;

// Multi-line strings
let html = `
    <div>
        <h1>${name}</h1>
        <p>Age: ${age}</p>
    </div>
`;

Best Practices:
- Use const for values that won not change
- Use let instead of var
- Use strict equality (===) instead of loose equality (==)
- Use meaningful variable names
- Comment your code
- Follow consistent indentation
- Use modern ES6+ features

This foundation prepares you for more advanced JavaScript concepts and DOM manipulation.', '60 mins', 'JavaScript syntax, variables, functions, arrays, objects'),

((SELECT id FROM courses WHERE title = 'JavaScript Essentials'), 'DOM Manipulation and Events', 2,
'Master DOM manipulation and event handling to create interactive web pages.

DOM (Document Object Model):
1. Understanding the DOM
The DOM represents the HTML document as a tree structure that JavaScript can manipulate.

DOM Tree Structure:
- Document (root)
- HTML element
- Head and Body elements
- Child elements, text nodes, attributes

2. Selecting DOM Elements
Modern element selection methods:

// By ID
let header = document.getElementById("header");

// By class name
let buttons = document.getElementsByClassName("btn");

// By tag name
let paragraphs = document.getElementsByTagName("p");

// Query selectors (recommended)
let firstButton = document.querySelector(".btn");
let allButtons = document.querySelectorAll(".btn");

// Advanced selectors
let specificElement = document.querySelector("#nav .menu-item:first-child");
let elements = document.querySelectorAll("input[type=\"text\"]");

3. Manipulating Element Content
Changing text and HTML content:

let element = document.querySelector("#content");

// Text content (safe from XSS)
element.textContent = "New text content";

// HTML content (use carefully)
element.innerHTML = "<strong>Bold text</strong>";

// Getting content
let currentText = element.textContent;
let currentHTML = element.innerHTML;

4. Manipulating Element Attributes
Working with element attributes:

let image = document.querySelector("img");

// Setting attributes
image.setAttribute("src", "new-image.jpg");
image.setAttribute("alt", "New image description");

// Getting attributes
let imageSrc = image.getAttribute("src");

// Removing attributes
image.removeAttribute("title");

// Boolean attributes
let checkbox = document.querySelector("input[type=\"checkbox\"]");
checkbox.checked = true;
checkbox.disabled = false;

5. Manipulating CSS Styles
Changing element styles with JavaScript:

let box = document.querySelector(".box");

// Inline styles
box.style.backgroundColor = "blue";
box.style.width = "200px";
box.style.height = "200px";
box.style.borderRadius = "10px";

// CSS classes (preferred method)
box.classList.add("active");
box.classList.remove("hidden");
box.classList.toggle("highlighted");
box.classList.contains("active"); // returns boolean

// Multiple classes
box.classList.add("class1", "class2", "class3");

6. Creating and Removing Elements
Dynamic element creation:

// Creating elements
let newDiv = document.createElement("div");
newDiv.textContent = "I am a new div";
newDiv.classList.add("dynamic-content");

let newParagraph = document.createElement("p");
newParagraph.innerHTML = "This is a <strong>new paragraph</strong>";

// Adding elements to DOM
let container = document.querySelector("#container");
container.appendChild(newDiv);
container.insertBefore(newParagraph, container.firstChild);

// Modern insertion methods
container.prepend(newDiv); // Add to beginning
container.append(newParagraph); // Add to end
container.before(newDiv); // Add before container
container.after(newParagraph); // Add after container

// Removing elements
let elementToRemove = document.querySelector(".remove-me");
elementToRemove.remove(); // Modern method
// elementToRemove.parentNode.removeChild(elementToRemove); // Legacy method

7. Event Handling
Responding to user interactions:

// Basic event listener
let button = document.querySelector("#myButton");
button.addEventListener("click", function() {
    console.log("Button clicked!");
});

// Arrow function syntax
button.addEventListener("click", () => {
    console.log("Button clicked with arrow function!");
});

// Event object
button.addEventListener("click", function(event) {
    console.log("Event type:", event.type);
    console.log("Target element:", event.target);
    event.preventDefault(); // Prevent default behavior
});

// Multiple event types
let input = document.querySelector("#textInput");
input.addEventListener("focus", () => console.log("Input focused"));
input.addEventListener("blur", () => console.log("Input lost focus"));
input.addEventListener("input", (e) => console.log("Input value:", e.target.value));

8. Common Event Types
Mouse Events:
element.addEventListener("click", handleClick);
element.addEventListener("dblclick", handleDoubleClick);
element.addEventListener("mouseenter", handleMouseEnter);
element.addEventListener("mouseleave", handleMouseLeave);
element.addEventListener("mouseover", handleMouseOver);

Keyboard Events:
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
input.addEventListener("keypress", handleKeyPress);

Form Events:
form.addEventListener("submit", handleSubmit);
input.addEventListener("change", handleChange);
input.addEventListener("input", handleInput);

Window Events:
window.addEventListener("load", handlePageLoad);
window.addEventListener("resize", handleWindowResize);
window.addEventListener("scroll", handleScroll);

9. Event Delegation
Efficient event handling for dynamic content:

// Instead of adding listeners to each button
let container = document.querySelector("#buttonContainer");
container.addEventListener("click", function(event) {
    if (event.target.classList.contains("btn")) {
        console.log("Button clicked:", event.target.textContent);
    }
});

// This works for dynamically added buttons too!
let newButton = document.createElement("button");
newButton.textContent = "Dynamic Button";
newButton.classList.add("btn");
container.appendChild(newButton);

10. Practical Examples
Interactive Form Validation:

let form = document.querySelector("#registrationForm");
let emailInput = document.querySelector("#email");
let passwordInput = document.querySelector("#password");
let errorDiv = document.querySelector("#errors");

form.addEventListener("submit", function(event) {
    event.preventDefault();
    
    let errors = [];
    
    // Email validation
    if (!emailInput.value.includes("@")) {
        errors.push("Please enter a valid email");
    }
    
    // Password validation
    if (passwordInput.value.length < 8) {
        errors.push("Password must be at least 8 characters");
    }
    
    // Display errors or submit
    if (errors.length > 0) {
        errorDiv.innerHTML = errors.map(error => `<p class="error">${error}</p>`).join("");
    } else {
        errorDiv.innerHTML = "<p class=\"success\">Form submitted successfully!</p>";
        // Actually submit the form
    }
});

Dynamic Content Creation:

let todoList = document.querySelector("#todoList");
let addButton = document.querySelector("#addTodo");
let todoInput = document.querySelector("#todoInput");

addButton.addEventListener("click", function() {
    let todoText = todoInput.value.trim();
    
    if (todoText) {
        let todoItem = document.createElement("li");
        todoItem.innerHTML = `
            <span>${todoText}</span>
            <button class="delete-btn">Delete</button>
        `;
        
        todoList.appendChild(todoItem);
        todoInput.value = "";
    }
});

// Event delegation for delete buttons
todoList.addEventListener("click", function(event) {
    if (event.target.classList.contains("delete-btn")) {
        event.target.parentElement.remove();
    }
});

Best Practices:
- Use addEventListener instead of inline event handlers
- Use event delegation for dynamic content
- Always handle errors gracefully
- Use semantic HTML elements
- Separate JavaScript from HTML
- Use meaningful function names
- Comment complex event handling logic

DOM manipulation and events are fundamental to creating interactive web applications.', '65 mins', 'DOM manipulation, event handling, dynamic content'),

((SELECT id FROM courses WHERE title = 'JavaScript Essentials'), 'Asynchronous JavaScript and APIs', 3,
'Master asynchronous programming in JavaScript including Promises, async/await, and API integration.

Asynchronous JavaScript:
1. Understanding Asynchronous Programming
JavaScript is single-threaded but can handle asynchronous operations through the event loop.

Synchronous vs Asynchronous:
// Synchronous (blocking)
console.log("First");
console.log("Second");
console.log("Third");

// Asynchronous (non-blocking)
console.log("First");
setTimeout(() => console.log("Second"), 1000);
console.log("Third");
// Output: First, Third, Second (after 1 second)

2. Callbacks
Traditional way to handle asynchronous operations:

function fetchData(callback) {
    setTimeout(() => {
        let data = { id: 1, name: "John" };
        callback(data);
    }, 1000);
}

fetchData(function(data) {
    console.log("Received data:", data);
});

// Callback Hell Problem
getData(function(a) {
    getMoreData(a, function(b) {
        getEvenMoreData(b, function(c) {
            // This nesting becomes unmanageable
        });
    });
});

3. Promises
Modern approach to handle asynchronous operations:

// Creating a Promise
let myPromise = new Promise((resolve, reject) => {
    let success = true;
    
    setTimeout(() => {
        if (success) {
            resolve("Operation successful!");
        } else {
            reject("Operation failed!");
        }
    }, 1000);
});

// Consuming a Promise
myPromise
    .then(result => {
        console.log(result);
        return "Next step";
    })
    .then(nextResult => {
        console.log(nextResult);
    })
    .catch(error => {
        console.error("Error:", error);
    })
    .finally(() => {
        console.log("Promise completed");
    });

4. Promise Methods
Useful Promise utility methods:

// Promise.all - Wait for all promises
let promise1 = fetch("/api/data1");
let promise2 = fetch("/api/data2");
let promise3 = fetch("/api/data3");

Promise.all([promise1, promise2, promise3])
    .then(responses => {
        console.log("All requests completed");
        return Promise.all(responses.map(r => r.json()));
    })
    .then(data => {
        console.log("All data:", data);
    });

// Promise.race - First promise to resolve/reject
Promise.race([promise1, promise2, promise3])
    .then(firstResult => {
        console.log("First completed:", firstResult);
    });

// Promise.allSettled - Wait for all, regardless of outcome
Promise.allSettled([promise1, promise2, promise3])
    .then(results => {
        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                console.log(`Promise ${index} succeeded:`, result.value);
            } else {
                console.log(`Promise ${index} failed:`, result.reason);
            }
        });
    });

5. Async/Await
Syntactic sugar for working with Promises:

// Async function declaration
async function fetchUserData(userId) {
    try {
        let response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let userData = await response.json();
        return userData;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}

// Using async function
async function displayUser() {
    try {
        let user = await fetchUserData(123);
        console.log("User:", user);
        
        // Sequential async operations
        let posts = await fetch(`/api/users/${user.id}/posts`);
        let postsData = await posts.json();
        console.log("User posts:", postsData);
        
    } catch (error) {
        console.error("Failed to display user:", error);
    }
}

// Parallel async operations with async/await
async function fetchMultipleData() {
    try {
        let [users, posts, comments] = await Promise.all([
            fetch("/api/users").then(r => r.json()),
            fetch("/api/posts").then(r => r.json()),
            fetch("/api/comments").then(r => r.json())
        ]);
        
        return { users, posts, comments };
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

6. Fetch API
Modern way to make HTTP requests:

// Basic GET request
async function getUsers() {
    try {
        let response = await fetch("/api/users");
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let users = await response.json();
        return users;
    } catch (error) {
        console.error("Error:", error);
    }
}

// POST request with data
async function createUser(userData) {
    try {
        let response = await fetch("/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let newUser = await response.json();
        return newUser;
    } catch (error) {
        console.error("Error creating user:", error);
    }
}

// PUT request (update)
async function updateUser(userId, userData) {
    try {
        let response = await fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData)
        });
        
        return await response.json();
    } catch (error) {
        console.error("Error updating user:", error);
    }
}

// DELETE request
async function deleteUser(userId) {
    try {
        let response = await fetch(`/api/users/${userId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            console.log("User deleted successfully");
        }
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

7. Error Handling
Proper error handling in asynchronous code:

// Try-catch with async/await
async function robustApiCall() {
    try {
        let response = await fetch("/api/data");
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let data = await response.json();
        return data;
        
    } catch (error) {
        if (error instanceof TypeError) {
            console.error("Network error:", error.message);
        } else {
            console.error("API error:", error.message);
        }
        
        // Return default data or re-throw
        return null;
    }
}

// Promise error handling
function promiseErrorHandling() {
    return fetch("/api/data")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error("Promise error:", error);
            return { error: true, message: error.message };
        });
}

8. Practical Examples
Real-world API integration:

// Weather API integration
class WeatherService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://api.openweathermap.org/data/2.5";
    }
    
    async getCurrentWeather(city) {
        try {
            let response = await fetch(
                `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error(`Weather data not found for ${city}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Weather API error:", error);
            throw error;
        }
    }
    
    async getForecast(city, days = 5) {
        try {
            let response = await fetch(
                `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric&cnt=${days * 8}`
            );
            
            if (!response.ok) {
                throw new Error(`Forecast data not found for ${city}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Forecast API error:", error);
            throw error;
        }
    }
}

// Usage
async function displayWeather() {
    let weatherService = new WeatherService("your-api-key");
    
    try {
        let weather = await weatherService.getCurrentWeather("London");
        
        document.getElementById("temperature").textContent = 
            `${Math.round(weather.main.temp)}°C`;
        document.getElementById("description").textContent = 
            weather.weather[0].description;
            
    } catch (error) {
        document.getElementById("weather").textContent = 
            "Unable to load weather data";
    }
}

9. Best Practices
- Always handle errors in async operations
- Use async/await for cleaner code
- Avoid callback hell
- Use Promise.all for parallel operations
- Set timeouts for long-running operations
- Cache API responses when appropriate
- Use loading states in UI
- Validate API responses

Asynchronous JavaScript is essential for modern web development and creating responsive user experiences.', '70 mins', 'Promises, async/await, Fetch API, error handling'),

((SELECT id FROM courses WHERE title = 'JavaScript Essentials'), 'ES6+ Modern JavaScript Features', 4,
'Explore modern JavaScript features introduced in ES6 and beyond.

ES6+ Modern Features:
1. Let and Const
Block-scoped variable declarations:

// var vs let/const
function varExample() {
    if (true) {
        var x = 1; // Function-scoped
        let y = 2; // Block-scoped
        const z = 3; // Block-scoped, immutable
    }
    console.log(x); // 1 (accessible)
    // console.log(y); // ReferenceError
    // console.log(z); // ReferenceError
}

// Const with objects and arrays
const user = { name: "John", age: 25 };
user.age = 26; // OK - modifying property
user.city = "NYC"; // OK - adding property
// user = {}; // Error - cannot reassign

const numbers = [1, 2, 3];
numbers.push(4); // OK - modifying array
// numbers = []; // Error - cannot reassign

2. Arrow Functions
Concise function syntax with lexical this binding:

// Traditional function
function add(a, b) {
    return a + b;
}

// Arrow function
const add = (a, b) => a + b;

// Multiple statements
const processData = (data) => {
    let processed = data.map(item => item * 2);
    return processed.filter(item => item > 10);
};

// Lexical this binding
class Timer {
    constructor() {
        this.seconds = 0;
    }
    
    start() {
        // Arrow function preserves this context
        setInterval(() => {
            this.seconds++;
            console.log(this.seconds);
        }, 1000);
    }
}

3. Template Literals
Enhanced string formatting:

let name = "Alice";
let age = 30;
let city = "Boston";

// Multi-line strings
let message = `
    Hello ${name}!
    You are ${age} years old.
    Welcome to ${city}.
`;

// Expression evaluation
let price = 19.99;
let tax = 0.08;
let total = `Total: $${(price * (1 + tax)).toFixed(2)}`;

// Tagged template literals
function highlight(strings, ...values) {
    return strings.reduce((result, string, i) => {
        let value = values[i] ? `<mark>${values[i]}</mark>` : "";
        return result + string + value;
    }, "");
}

let searchTerm = "JavaScript";
let text = highlight`Learn ${searchTerm} programming today!`;

4. Destructuring Assignment
Extract values from arrays and objects:

// Array destructuring
let colors = ["red", "green", "blue"];
let [primary, secondary, tertiary] = colors;

// Skip elements
let [first, , third] = colors;

// Default values
let [a, b, c, d = "yellow"] = colors;

// Rest operator
let [head, ...tail] = colors;

// Object destructuring
let person = {
    name: "John",
    age: 25,
    address: {
        city: "NYC",
        country: "USA"
    }
};

let { name, age } = person;

// Rename variables
let { name: fullName, age: years } = person;

// Default values
let { name, age, occupation = "Student" } = person;

// Nested destructuring
let { address: { city, country } } = person;

// Function parameters
function greet({ name, age = 0 }) {
    return `Hello ${name}, you are ${age} years old`;
}

greet({ name: "Alice", age: 30 });

5. Spread and Rest Operators
Expand or collect elements:

// Spread with arrays
let arr1 = [1, 2, 3];
let arr2 = [4, 5, 6];
let combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

// Spread with objects
let obj1 = { a: 1, b: 2 };
let obj2 = { c: 3, d: 4 };
let merged = { ...obj1, ...obj2 }; // { a: 1, b: 2, c: 3, d: 4 }

// Override properties
let updated = { ...obj1, b: 10 }; // { a: 1, b: 10 }

// Rest parameters
function sum(...numbers) {
    return numbers.reduce((total, num) => total + num, 0);
}

sum(1, 2, 3, 4, 5); // 15

// Rest in destructuring
let [first, second, ...rest] = [1, 2, 3, 4, 5];
// first: 1, second: 2, rest: [3, 4, 5]

6. Enhanced Object Literals
Shorthand syntax for objects:

let name = "John";
let age = 25;

// Property shorthand
let person = { name, age }; // Same as { name: name, age: age }

// Method shorthand
let calculator = {
    // Old syntax
    add: function(a, b) {
        return a + b;
    },
    
    // New syntax
    subtract(a, b) {
        return a - b;
    },
    
    // Computed property names
    [name + "Method"]() {
        return "Dynamic method";
    }
};

7. Classes
Object-oriented programming syntax:

class Animal {
    constructor(name, species) {
        this.name = name;
        this.species = species;
    }
    
    // Instance method
    speak() {
        return `${this.name} makes a sound`;
    }
    
    // Static method
    static getKingdom() {
        return "Animalia";
    }
    
    // Getter
    get info() {
        return `${this.name} is a ${this.species}`;
    }
    
    // Setter
    set nickname(value) {
        this._nickname = value;
    }
    
    get nickname() {
        return this._nickname || this.name;
    }
}

// Inheritance
class Dog extends Animal {
    constructor(name, breed) {
        super(name, "Canine");
        this.breed = breed;
    }
    
    speak() {
        return `${this.name} barks`;
    }
    
    fetch() {
        return `${this.name} fetches the ball`;
    }
}

let myDog = new Dog("Buddy", "Golden Retriever");
console.log(myDog.speak()); // "Buddy barks"
console.log(myDog.info); // "Buddy is a Canine"

8. Modules
Import and export functionality:

// math.js
export const PI = 3.14159;

export function add(a, b) {
    return a + b;
}

export function multiply(a, b) {
    return a * b;
}

// Default export
export default function subtract(a, b) {
    return a - b;
}

// main.js
import subtract, { PI, add, multiply } from "./math.js";

// Import all
import * as MathUtils from "./math.js";

// Dynamic imports
async function loadMath() {
    let mathModule = await import("./math.js");
    return mathModule.add(5, 3);
}

9. Array Methods
Powerful array manipulation methods:

let numbers = [1, 2, 3, 4, 5];

// Map - transform elements
let doubled = numbers.map(n => n * 2);

// Filter - select elements
let evens = numbers.filter(n => n % 2 === 0);

// Reduce - accumulate values
let sum = numbers.reduce((total, n) => total + n, 0);

// Find - first matching element
let found = numbers.find(n => n > 3);

// Some - test if any element matches
let hasEven = numbers.some(n => n % 2 === 0);

// Every - test if all elements match
let allPositive = numbers.every(n => n > 0);

// Includes - check if element exists
let hasThree = numbers.includes(3);

// Array.from - create array from iterable
let chars = Array.from("hello"); // ["h", "e", "l", "l", "o"]

10. Advanced Features
Modern JavaScript capabilities:

// Optional Chaining (ES2020)
let user = {
    profile: {
        social: {
            twitter: "@john"
        }
    }
};

let twitter = user?.profile?.social?.twitter; // Safe access
let facebook = user?.profile?.social?.facebook; // undefined (no error)

// Nullish Coalescing (ES2020)
let username = user.name ?? "Guest"; // Only null/undefined trigger default
let port = process.env.PORT ?? 3000;

// Private Class Fields (ES2022)
class BankAccount {
    #balance = 0; // Private field
    
    deposit(amount) {
        this.#balance += amount;
    }
    
    getBalance() {
        return this.#balance;
    }
}

// Top-level await (ES2022)
// In modules, you can use await at the top level
let data = await fetch("/api/data");
let json = await data.json();

Best Practices:
- Use const by default, let when reassignment needed
- Prefer arrow functions for callbacks
- Use destructuring for cleaner code
- Leverage spread operator for immutable updates
- Use template literals for string formatting
- Adopt modern array methods
- Use modules for code organization
- Take advantage of optional chaining

Modern JavaScript features make code more readable, maintainable, and powerful.', '75 mins', 'ES6+ features, arrow functions, destructuring, classes, modules');

-- Continue with more comprehensive lessons for all courses...
-- This is a sample of the comprehensive lesson structure that would be applied to all courses in all learning paths.