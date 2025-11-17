import {
  cleanupOldConversations,
  cleanupOldRateLimits,
} from "@/lib/rateLimitQueries";
import { CHATBOT_CONFIG } from "@/config/chatbot";
import { NextRequest } from "next/server";

/**
 * Cron job endpoint to cleanup old chat conversations and rate limits
 * Runs daily at 3 AM UTC via Vercel Cron
 * Ensures GDPR compliance by deleting data after retention period
 */
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Clean up old conversations based on configured retention days
    await cleanupOldConversations(CHATBOT_CONFIG.messageRetentionDays);

    // Clean up old rate limit entries (always 7 days)
    await cleanupOldRateLimits();

    console.log(
      `✅ Cleanup successful: deleted conversations older than ${CHATBOT_CONFIG.messageRetentionDays} days`,
    );

    return Response.json({
      success: true,
      retentionDays: CHATBOT_CONFIG.messageRetentionDays,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cleanup cron error:", error);
    return Response.json(
      { success: false, error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
