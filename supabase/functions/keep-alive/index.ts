import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BACKEND_URL = Deno.env.get('BACKEND_URL') || 'https://attendance-system-client-jk9s.onrender.com';

Deno.serve(async (req: Request) => {
  try {
    // Ping the backend health endpoint
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const timestamp = new Date().toISOString();

    if (response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Backend pinged successfully',
          backendStatus: data,
          timestamp,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Backend ping failed',
          status: response.status,
          timestamp,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error pinging backend',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

