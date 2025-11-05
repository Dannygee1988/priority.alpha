import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WEBHOOK_URL = "https://n8n.srv997647.hstgr.cloud/webhook/e3610916-e909-43be-9824-f66a9aaa1a32";

interface CallData {
  id: string;
  user_id: string;
  agent_id: string;
  phone_number: string;
  name: string;
  last_name: string;
  caller_email?: string;
  street?: string;
  city?: string;
  post_code?: string;
  reason_for_sale?: string;
  last_contacted?: string;
  call_status: string;
  call_duration: number;
  cost: number;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { call }: { call: CallData } = await req.json();

    if (!call) {
      return new Response(
        JSON.stringify({ error: "No call provided" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "outbound_call_queued",
          timestamp: new Date().toISOString(),
          call: {
            id: call.id,
            user_id: call.user_id,
            agent_id: call.agent_id,
            phone_number: call.phone_number,
            name: call.name,
            last_name: call.last_name,
            caller_email: call.caller_email,
            street: call.street,
            city: call.city,
            post_code: call.post_code,
            reason_for_sale: call.reason_for_sale,
            last_contacted: call.last_contacted,
            call_status: call.call_status,
            call_duration: call.call_duration,
            cost: call.cost,
            created_at: call.created_at,
          },
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send webhook for call ${call.id}: ${response.status}`);
        return new Response(
          JSON.stringify({ success: false, call_id: call.id, error: response.statusText }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          call_id: call.id,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error(`Error sending webhook for call ${call.id}:`, error);
      return new Response(
        JSON.stringify({ success: false, call_id: call.id, error: error.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error processing webhook request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
