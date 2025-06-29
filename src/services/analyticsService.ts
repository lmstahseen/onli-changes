import { supabase } from '../lib/supabase';

export interface StudentAnalyticsOverview {
  totalLessonsCompleted: number;
  averageQuizScore: number;
  enrolledCourses: {
    id: number;
    title: string;
    progress: number;
    lastActivity: string;
  }[];
  activityData: {
    date: string;
    count: number;
  }[];
  totalStudyHours: number;
  streakDays: number;
}

export interface TeacherAnalyticsOverview {
  totalRevenue: number;
  totalStudents: number;
  totalCourses: number;
  averageRating: number;
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  studentsByMonth: {
    month: string;
    count: number;
  }[];
  coursePerformance: {
    id: number;
    title: string;
    students: number;
    revenue: number;
    averageProgress: number;
    averageRating: number;
  }[];
}

export interface CourseAnalytics {
  id: number;
  title: string;
  totalStudents: number;
  totalRevenue: number;
  averageProgress: number;
  averageRating: number;
  enrollmentTrend: {
    date: string;
    count: number;
  }[];
  progressDistribution: {
    range: string;
    count: number;
  }[];
  lessonCompletionRates: {
    lessonId: number;
    lessonTitle: string;
    completionRate: number;
    averageQuizScore: number;
  }[];
}

export class AnalyticsService {
  static async getStudentAnalyticsOverview(): Promise<StudentAnalyticsOverview> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get completed lessons
    const { data: completedLessons, error: lessonsError } = await supabase
      .from('lesson_progress')
      .select('completed_at, lesson_id')
      .eq('student_id', user.id)
      .eq('completed', true);

    if (lessonsError) throw lessonsError;

    // Get quiz attempts
    const { data: quizAttempts, error: quizError } = await supabase
      .from('student_quiz_attempts')
      .select('score')
      .eq('student_id', user.id);

    if (quizError) throw quizError;

    // Get enrolled courses with progress
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        progress,
        enrolled_at,
        courses!inner (
          id,
          title
        )
      `)
      .eq('student_id', user.id);

    if (enrollmentsError) throw enrollmentsError;

    // Calculate average quiz score
    const averageQuizScore = quizAttempts && quizAttempts.length > 0
      ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
      : 0;

    // Format enrolled courses
    const enrolledCoursesData = enrollments?.map(enrollment => ({
      id: enrollment.courses.id,
      title: enrollment.courses.title,
      progress: enrollment.progress,
      lastActivity: enrollment.enrolled_at // This would ideally be the last activity date
    })) || [];

    // Generate activity data (last 30 days)
    const activityData = generateActivityData(completedLessons || []);

    // Calculate total study hours (estimate 45 minutes per completed lesson)
    const totalStudyHours = Math.round((completedLessons?.length || 0) * 0.75);

    // Calculate streak days
    const streakDays = calculateStreakDays(completedLessons || []);

    return {
      totalLessonsCompleted: completedLessons?.length || 0,
      averageQuizScore,
      enrolledCourses: enrolledCoursesData,
      activityData,
      totalStudyHours,
      streakDays
    };
  }

  static async getTeacherAnalyticsOverview(): Promise<TeacherAnalyticsOverview> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get all courses created by the teacher
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments(student_id, enrolled_at)
      `)
      .eq('instructor_id', user.id);

    if (coursesError) throw coursesError;

    // Calculate total students (unique)
    const studentIds = new Set();
    let totalRevenue = 0;

    courses?.forEach(course => {
      const studentCount = course.enrollments?.length || 0;
      course.enrollments?.forEach((enrollment: any) => {
        studentIds.add(enrollment.student_id);
      });
      totalRevenue += studentCount * course.price;
    });

    // Generate monthly revenue and student data
    const { revenueByMonth, studentsByMonth } = generateMonthlyData(courses || []);

    // Format course performance data
    const coursePerformance = courses?.map(course => {
      const studentCount = course.enrollments?.length || 0;
      const revenue = studentCount * course.price;
      
      return {
        id: course.id,
        title: course.title,
        students: studentCount,
        revenue,
        averageProgress: 75, // Mock data - would be calculated from actual progress
        averageRating: 4.5 // Mock data - would be calculated from actual ratings
      };
    }) || [];

    return {
      totalRevenue,
      totalStudents: studentIds.size,
      totalCourses: courses?.length || 0,
      averageRating: 4.7, // Mock data - would be calculated from actual ratings
      revenueByMonth,
      studentsByMonth,
      coursePerformance
    };
  }

  static async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('instructor_id', user.id)
      .single();

    if (courseError) throw courseError;

    // Get enrollments for this course
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('student_id, enrolled_at, progress')
      .eq('course_id', courseId);

    if (enrollmentsError) throw enrollmentsError;

    // Get modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        lessons(
          id,
          title
        )
      `)
      .eq('course_id', courseId);

    if (modulesError) throw modulesError;

    // Flatten lessons from all modules
    const lessons = modules?.flatMap(module => 
      module.lessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    ) || [];

    // Get lesson completion data
    const lessonCompletionRates = await Promise.all(
      lessons.map(async (lesson) => {
        // Get total enrollments
        const totalEnrollments = enrollments?.length || 0;
        
        // Get completed lessons
        const { count: completedCount, error: completedError } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('lesson_id', lesson.id)
          .eq('completed', true);

        if (completedError) throw completedError;

        // Get quiz attempts for this lesson
        const { data: quizAttempts, error: quizError } = await supabase
          .from('student_quiz_attempts')
          .select('score')
          .eq('lesson_id', lesson.id);

        if (quizError) throw quizError;

        // Calculate average quiz score
        const averageQuizScore = quizAttempts && quizAttempts.length > 0
          ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
          : 0;

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completionRate: totalEnrollments > 0 ? (completedCount || 0) / totalEnrollments * 100 : 0,
          averageQuizScore
        };
      })
    );

    // Calculate enrollment trend (by month)
    const enrollmentTrend = generateEnrollmentTrend(enrollments || []);

    // Calculate progress distribution
    const progressDistribution = [
      { range: '0-25%', count: enrollments?.filter(e => e.progress <= 25).length || 0 },
      { range: '26-50%', count: enrollments?.filter(e => e.progress > 25 && e.progress <= 50).length || 0 },
      { range: '51-75%', count: enrollments?.filter(e => e.progress > 50 && e.progress <= 75).length || 0 },
      { range: '76-100%', count: enrollments?.filter(e => e.progress > 75).length || 0 }
    ];

    return {
      id: course.id,
      title: course.title,
      totalStudents: enrollments?.length || 0,
      totalRevenue: (enrollments?.length || 0) * course.price,
      averageProgress: enrollments && enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
        : 0,
      averageRating: 4.7, // Mock data - would be calculated from actual ratings
      enrollmentTrend,
      progressDistribution,
      lessonCompletionRates
    };
  }
}

// Helper functions
function generateActivityData(completedLessons: any[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  // Count lessons completed per day
  const activityCounts: { [key: string]: number } = {};
  
  completedLessons.forEach(lesson => {
    if (!lesson.completed_at) return;
    
    const date = new Date(lesson.completed_at).toISOString().split('T')[0];
    activityCounts[date] = (activityCounts[date] || 0) + 1;
  });

  // Format data for the last 30 days
  return last30Days.map(date => ({
    date,
    count: activityCounts[date] || 0
  }));
}

function calculateStreakDays(completedLessons: any[]) {
  if (completedLessons.length === 0) return 0;
  
  // Get unique dates when lessons were completed
  const completionDates = completedLessons
    .filter(lesson => lesson.completed_at)
    .map(lesson => new Date(lesson.completed_at).toISOString().split('T')[0])
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completionDates.length === 0) return 0;

  // Check if the most recent date is today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (completionDates[0] !== today && completionDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < completionDates.length; i++) {
    const currentDate = new Date(completionDates[i-1]);
    const prevDate = new Date(completionDates[i]);
    
    // Check if dates are consecutive
    currentDate.setDate(currentDate.getDate() - 1);
    if (currentDate.toISOString().split('T')[0] === completionDates[i]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function generateMonthlyData(courses: any[]) {
  // Get last 12 months
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }).reverse();

  // Initialize data structures
  const revenueData: { [key: string]: number } = {};
  const studentData: { [key: string]: Set<string> } = {};
  
  last12Months.forEach(month => {
    revenueData[month] = 0;
    studentData[month] = new Set();
  });

  // Process course enrollments
  courses.forEach(course => {
    const price = course.price;
    
    (course.enrollments || []).forEach((enrollment: any) => {
      const enrollmentMonth = new Date(enrollment.enrolled_at).toISOString().split('T')[0].substring(0, 7);
      
      // Only count enrollments in the last 12 months
      if (last12Months.includes(enrollmentMonth)) {
        revenueData[enrollmentMonth] += price;
        studentData[enrollmentMonth].add(enrollment.student_id);
      }
    });
  });

  // Format data for charts
  const revenueByMonth = last12Months.map(month => ({
    month,
    revenue: revenueData[month]
  }));

  const studentsByMonth = last12Months.map(month => ({
    month,
    count: studentData[month].size
  }));

  return { revenueByMonth, studentsByMonth };
}

function generateEnrollmentTrend(enrollments: any[]) {
  // Get last 12 months
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }).reverse();

  // Count enrollments per month
  const enrollmentCounts: { [key: string]: number } = {};
  
  last12Months.forEach(month => {
    enrollmentCounts[month] = 0;
  });

  enrollments.forEach(enrollment => {
    const enrollmentMonth = new Date(enrollment.enrolled_at).toISOString().split('T')[0].substring(0, 7);
    
    // Only count enrollments in the last 12 months
    if (last12Months.includes(enrollmentMonth)) {
      enrollmentCounts[enrollmentMonth] = (enrollmentCounts[enrollmentMonth] || 0) + 1;
    }
  });

  // Format data for charts
  return last12Months.map(month => ({
    date: month,
    count: enrollmentCounts[month]
  }));
}