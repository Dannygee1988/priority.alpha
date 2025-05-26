import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, name } = await req.json();

    // Here you would integrate with your email service provider
    // For now, we'll just log the email content
    console.log(`
      To: ${email}
      Subject: Welcome to Pri0r1ty
      
      Hi ${name},
      
      Your Pri0r1ty account has been created. Here are your login credentials:
      
      Email: ${email}
      Password: ${password}
      
      Please change your password after your first login.
      
      Best regards,
      The Pri0r1ty Team
    `);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});