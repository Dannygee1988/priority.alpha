import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const N8N_WEBHOOK_URL = "https://pri0r1ty.app.n8n.cloud/webhook/25160821-3074-43d1-99ae-4108030d3eef";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the incoming request body
    const payload = await req.json();

    console.log("Proxying request to N8N webhook", { payload });

    // Forward the request to N8N webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("N8N webhook error:", {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        body: errorText,
      });
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${errorText}`);
    }

    // Get the response from N8N
    const n8nData = await n8nResponse.json();
    console.log("N8N webhook response:", { n8nData });

    // Return the N8N response with CORS headers
    return new Response(JSON.stringify(n8nData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in advisor-webhook:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process webhook request",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
