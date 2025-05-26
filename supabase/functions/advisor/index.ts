import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { OpenAI } from "npm:openai@4.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  message: string;
  assistantId: string;
  conversationId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { message, assistantId, conversationId } = body;

    if (!message || !assistantId || !conversationId) {
      throw new Error("Missing required parameters");
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Create a thread if it doesn't exist
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== "completed") {
      if (runStatus.status === "failed" || runStatus.status === "cancelled") {
        throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    // Prepare the response
    const response = {
      content: lastMessage.content[0].text.value,
      threadId: thread.id,
      sources: [], // Add sources if available in your implementation
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("Error in advisor function:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred while processing your request",
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