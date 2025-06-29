import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GenerateCertificateRequest {
  certification_id: number;
}

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

    // Parse request body
    const { certification_id }: GenerateCertificateRequest = await req.json();

    if (!certification_id) {
      return new Response(
        JSON.stringify({ error: 'certification_id is required' }),
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
      .eq('certification_id', certification_id)
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

    // Check if certificate already exists
    const { data: existingCertificate } = await supabaseClient
      .from('certificates')
      .select('id')
      .eq('student_id', user.id)
      .eq('certification_id', certification_id)
      .single();

    let certificateId: string;

    if (existingCertificate) {
      certificateId = existingCertificate.id;
    } else {
      // Generate a unique certificate ID
      certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create certificate record
      const { error: certificateError } = await supabaseClient
        .from('certificates')
        .insert({
          id: certificateId,
          student_id: user.id,
          certification_id,
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
        .eq('certification_id', certification_id);
    }

    // Get certification details
    const { data: certification, error: certificationError } = await supabaseClient
      .from('certifications')
      .select('*')
      .eq('id', certification_id)
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
          issue_date: enrollment.completed_at || new Date().toISOString(),
          skills: certification.skills || [],
          certification_id
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-certificate function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});