import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const payload = await req.json();
    console.log("Received webhook payload:", payload);

    // Extract data from payload
    const { message_id, conversation_id, company_id, output, message, content, sources } = payload;

    // Determine the assistant's response content
    const assistantContent = output || message || content;

    if (!assistantContent) {
      throw new Error("No content in webhook payload");
    }

    if (!company_id || !conversation_id || !message_id) {
      throw new Error("Missing required fields: company_id, conversation_id, or message_id");
    }

    // Insert the assistant's response into the database
    const { data, error } = await supabase
      .from("advisor_messages")
      .insert({
        company_id,
        conversation_id,
        role: "assistant",
        content: assistantContent,
        parent_id: message_id,
        sources: sources || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Successfully inserted message:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Response saved", data }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
