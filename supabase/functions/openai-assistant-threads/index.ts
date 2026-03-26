import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  assistantId: string;
  action?: 'getThreads' | 'getAssistantConfig' | 'updateAssistantConfig';
  instructions?: string;
  temperature?: number;
  top_p?: number;
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

    const { assistantId, action = 'getThreads', instructions, temperature, top_p }: RequestBody = await req.json();

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

    // Handle updating assistant configuration
    if (action === 'updateAssistantConfig') {
      const updateBody: any = {};
      if (instructions !== undefined) updateBody.instructions = instructions;
      if (temperature !== undefined) updateBody.temperature = temperature;
      if (top_p !== undefined) updateBody.top_p = top_p;

      const updateResponse = await fetch(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateBody),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const updatedData = await updateResponse.json();

      return new Response(
        JSON.stringify({
          id: updatedData.id,
          name: updatedData.name,
          description: updatedData.description,
          instructions: updatedData.instructions,
          model: updatedData.model,
          tools: updatedData.tools,
          metadata: updatedData.metadata,
          temperature: updatedData.temperature,
          top_p: updatedData.top_p,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle getting assistant configuration
    if (action === 'getAssistantConfig') {
      const assistantResponse = await fetch(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json",
          },
        }
      );

      if (!assistantResponse.ok) {
        const errorData = await assistantResponse.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const assistantData = await assistantResponse.json();

      return new Response(
        JSON.stringify({
          id: assistantData.id,
          name: assistantData.name,
          description: assistantData.description,
          instructions: assistantData.instructions,
          model: assistantData.model,
          tools: assistantData.tools,
          metadata: assistantData.metadata,
          temperature: assistantData.temperature,
          top_p: assistantData.top_p,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle getting threads (default action)
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
