import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  assistantId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { assistantId }: RequestBody = await req.json();

    if (!assistantId) {
      return new Response(
        JSON.stringify({ error: "Assistant ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const threadsResponse = await fetch(
      `https://api.openai.com/v1/threads`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
      }
    );

    if (!threadsResponse.ok) {
      const errorData = await threadsResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const threadsData = await threadsResponse.json();

    const threadsWithMessages = await Promise.all(
      threadsData.data.map(async (thread: any) => {
        const messagesResponse = await fetch(
          `https://api.openai.com/v1/threads/${thread.id}/messages`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${openaiApiKey}`,
              "OpenAI-Beta": "assistants=v2",
              "Content-Type": "application/json",
            },
          }
        );

        const messagesData = await messagesResponse.json();

        return {
          thread_id: thread.id,
          created_at: new Date(thread.created_at * 1000).toISOString(),
          metadata: thread.metadata,
          messages: messagesData.data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            created_at: new Date(msg.created_at * 1000).toISOString(),
            assistant_id: msg.assistant_id,
          })),
        };
      })
    );

    return new Response(
      JSON.stringify({ threads: threadsWithMessages }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error fetching assistant threads:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
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
