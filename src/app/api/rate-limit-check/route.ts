import { NextRequest } from "next/server";
import { getRateLimit } from "@/lib/getRateLimit";
import { CHATBOT_CONFIG } from "@/config/chatbot";

/**
 * Check rate limit status without incrementing the counter
 * Used by frontend to verify if window has expired
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response("Missing sessionId", { status: 400 });
    }

    const rateLimitResult = await getRateLimit(
      sessionId,
      CHATBOT_CONFIG.rateLimitMaxMessages,
      CHATBOT_CONFIG.rateLimitWindowSeconds,
    );

    return new Response(
      JSON.stringify({
        allowed: rateLimitResult.allowed,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        currentCount: rateLimitResult.currentCount,
      }),
      {
        status: rateLimitResult.allowed ? 200 : 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": CHATBOT_CONFIG.rateLimitMaxMessages.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": Math.floor(
            rateLimitResult.resetTime / 1000,
          ).toString(),
        },
      },
    );
  } catch (error) {
    console.error("Rate limit check error:", error);
    return new Response("Error checking rate limit", { status: 500 });
  }
}
