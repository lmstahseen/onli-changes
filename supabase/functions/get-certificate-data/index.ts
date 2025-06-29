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

    // Extract certification ID from URL
    const url = new URL(req.url);
    const certificationId = url.pathname.split('/').pop();

    if (!certificationId || isNaN(Number(certificationId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid certification ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Check if user has completed the certification
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('certification_enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('certification_id', certificationId)
      .single();

    if (enrollmentError) {
      return new Response(
        JSON.stringify({ error: 'Not enrolled in this certification' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!enrollment.completed_at) {
      return new Response(
        JSON.stringify({ error: 'Certification not completed yet' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get certificate data
    const { data: certificate, error: certificateError } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('student_id', user.id)
      .eq('certification_id', certificationId)
      .single();

    if (certificateError) {
      // If certificate doesn't exist, generate one
      return await generateCertificate(supabaseClient, user, parseInt(certificationId), corsHeaders);
    }

    // Get certification details
    const { data: certification, error: certificationError } = await supabaseClient
      .from('certifications')
      .select('*')
      .eq('id', certificationId)
      .single();

    if (certificationError) {
      return new Response(
        JSON.stringify({ error: 'Certification not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const studentName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student';

    // Return certificate data
    return new Response(
      JSON.stringify({
        certificate: {
          id: certificate.id,
          student_name: studentName,
          certification_title: certification.title,
          issue_date: certificate.issue_date,
          skills: certification.skills || [],
          certification_id: parseInt(certificationId)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-certificate-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate a certificate
async function generateCertificate(
  supabaseClient: any,
  user: any,
  certificationId: number,
  corsHeaders: any
) {
  try {
    // Generate a unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create certificate record
    const { error: certificateError } = await supabaseClient
      .from('certificates')
      .insert({
        id: certificateId,
        student_id: user.id,
        certification_id: certificationId,
        issue_date: new Date().toISOString()
      });

    if (certificateError) {
      console.error('Certificate creation error:', certificateError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate certificate' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update enrollment with certificate ID
    await supabaseClient
      .from('certification_enrollments')
      .update({
        certificate_id: certificateId
      })
      .eq('student_id', user.id)
      .eq('certification_id', certificationId);

    // Get certification details
    const { data: certification, error: certificationError } = await supabaseClient
      .from('certifications')
      .select('*')
      .eq('id', certificationId)
      .single();

    if (certificationError) {
      return new Response(
        JSON.stringify({ error: 'Certification not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const studentName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student';

    // Return certificate data
    return new Response(
      JSON.stringify({
        certificate: {
          id: certificateId,
          student_name: studentName,
          certification_title: certification.title,
          issue_date: new Date().toISOString(),
          skills: certification.skills || [],
          certification_id: certificationId
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error generating certificate:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate certificate' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}