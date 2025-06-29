import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Set auth for Supabase client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get all courses created by the teacher
    const { data: courses, error: coursesError } = await supabaseClient
      .from('courses')
      .select(`
        *,
        enrollments(student_id, enrolled_at)
      `)
      .eq('instructor_id', user.id);

    if (coursesError) {
      console.error('Courses fetch error:', coursesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch courses' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Return the analytics data
    return new Response(
      JSON.stringify({
        totalRevenue,
        totalStudents: studentIds.size,
        totalCourses: courses?.length || 0,
        averageRating: 4.7, // Mock data - would be calculated from actual ratings
        revenueByMonth,
        studentsByMonth,
        coursePerformance
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-teacher-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate monthly data
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