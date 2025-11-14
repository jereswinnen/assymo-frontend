import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { neon } from "@neondatabase/serverless";
import { CHATBOT_CONFIG } from "@/config/chatbot";

export const maxDuration = 30;

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !sessionId) {
      return new Response("Missing messages or sessionId", { status: 400 });
    }

    // Get IP address for logging
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      sessionId,
      CHATBOT_CONFIG.rateLimitMaxMessages,
      CHATBOT_CONFIG.rateLimitWindowSeconds,
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          resetTime: rateLimitResult.resetTime,
          remaining: 0,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Convert UIMessages to ModelMessages
    const modelMessages = convertToModelMessages(messages);

    // Get last user message text
    const lastUserMessage = messages[messages.length - 1];
    const userMessageText = lastUserMessage.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");

    // Stream response from OpenAI
    const result = streamText({
      model: openai(CHATBOT_CONFIG.model),
      system: CHATBOT_CONFIG.systemPrompt,
      messages: modelMessages,
      async onFinish({ text }) {
        // Log conversation after streaming completes
        const responseTime = Date.now() - startTime;

        try {
          await sql`
            INSERT INTO chat_conversations (
              session_id,
              ip_address,
              user_message,
              bot_response,
              response_time_ms
            )
            VALUES (
              ${sessionId},
              ${ip},
              ${userMessageText},
              ${text},
              ${responseTime}
            )
          `;
          console.log("✅ Conversation logged successfully");
        } catch (err) {
          console.error("❌ Failed to log conversation:", err);
          // Log more details
          console.error("Details:", {
            sessionId,
            ip,
            userMessageLength: userMessageText?.length,
            responseLength: text?.length,
            responseTime,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Error processing chat", { status: 500 });
  }
}
