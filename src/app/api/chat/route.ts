import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { neon } from "@neondatabase/serverless";
import { CHATBOT_CONFIG } from "@/config/chatbot";
import { retrieveRelevantChunks, hasDocuments } from "@/lib/retrieval";
import { bookingTools } from "@/lib/chatbot/booking-tools";

export const maxDuration = 30;

const sql = neon(process.env.DATABASE_URL!);

function anonymizeIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    // IPv4: 192.168.1.100 → 192.168.1.0
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  // IPv6 or unknown format: truncate to first 20 chars
  return ip.substring(0, Math.min(ip.length, 20));
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !sessionId) {
      return new Response("Missing messages or sessionId", { status: 400 });
    }

    // Get IP address for logging (anonymized for GDPR compliance)
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const anonymizedIP = anonymizeIP(ip);

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      sessionId,
      CHATBOT_CONFIG.rateLimitMaxMessages,
      CHATBOT_CONFIG.rateLimitWindowSeconds,
    );

    // Return rate limit headers in 429 response
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          resetTime: rateLimitResult.resetTime,
          remaining: 0,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": CHATBOT_CONFIG.rateLimitMaxMessages.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.floor(
              rateLimitResult.resetTime / 1000,
            ).toString(),
          },
        },
      );
    }

    // Convert UIMessages to ModelMessages
    const modelMessages = await convertToModelMessages(messages);

    // Get last user message text
    const lastUserMessage = messages[messages.length - 1];
    const userMessageText = lastUserMessage.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");

    // RAG: Retrieve relevant context from vector database (Phase 2)
    let systemPrompt: string = CHATBOT_CONFIG.systemPrompt;
    let retrievedChunks: string[] = [];

    try {
      const documentsExist = await hasDocuments();

      if (documentsExist) {
        // Retrieve top 3 relevant chunks for the user's question
        retrievedChunks = await retrieveRelevantChunks(userMessageText, 3);

        if (retrievedChunks.length > 0) {
          const context = retrievedChunks.join("\n\n");

          // Enhanced system prompt with RAG context
          systemPrompt = `${CHATBOT_CONFIG.systemPrompt}

BELANGRIJKE REGELS:
1. Gebruik ALLEEN de onderstaande bedrijfsinformatie om vragen te beantwoorden
2. Als een vraag niet gerelateerd is aan ons bedrijf of de verstrekte informatie, wijs dit beleefd af
3. Als je niet genoeg informatie hebt in de context hieronder, geef dit eerlijk toe

RELEVANTE BEDRIJFSINFORMATIE:
---
${context}
---

Baseer je antwoorden ALLEEN op bovenstaande informatie.`;
        }
      }
    } catch (error) {
      console.error("RAG retrieval error:", error);
      // Continue without RAG context on error (graceful degradation)
    }

    // Stream response from OpenAI
    const result = streamText({
      model: openai(CHATBOT_CONFIG.model),
      system: systemPrompt,
      messages: modelMessages,
      tools: bookingTools,
      stopWhen: stepCountIs(5), // Allow multiple tool calls + response generation
      providerOptions: {
        openai: {
          reasoningEffort: "minimal",
        },
      },
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
              ${anonymizedIP},
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

    // Add rate limit headers to successful responses
    const response = result.toUIMessageStreamResponse();
    response.headers.set(
      "X-RateLimit-Limit",
      CHATBOT_CONFIG.rateLimitMaxMessages.toString(),
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      Math.floor(rateLimitResult.resetTime / 1000).toString(),
    );

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Error processing chat", { status: 500 });
  }
}
