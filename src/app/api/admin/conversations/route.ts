import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "conversations" });
    if (!authorized) return response;

    // Get all conversations grouped by session_id
    const conversations = await sql`
      WITH conversation_summary AS (
        SELECT
          session_id,
          MIN(created_at) as started_at,
          MAX(created_at) as last_message_at,
          COUNT(*) as message_count,
          ip_address,
          AVG(response_time_ms)::INTEGER as avg_response_time
        FROM chat_conversations
        GROUP BY session_id, ip_address
      )
      SELECT
        cs.*,
        json_agg(
          json_build_object(
            'id', cc.id,
            'user_message', cc.user_message,
            'bot_response', cc.bot_response,
            'response_time_ms', cc.response_time_ms,
            'created_at', cc.created_at
          ) ORDER BY cc.created_at ASC
        ) as messages
      FROM conversation_summary cs
      JOIN chat_conversations cc ON cc.session_id = cs.session_id
      GROUP BY cs.session_id, cs.started_at, cs.last_message_at, cs.message_count, cs.ip_address, cs.avg_response_time
      ORDER BY cs.last_message_at DESC
      LIMIT 50
    `;

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
