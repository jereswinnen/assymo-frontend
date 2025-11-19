import { neon } from "@neondatabase/serverless";
import { NextRequest } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Get chat history for a session from the database
 * Returns all conversations for the given sessionId in chronological order
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response("Missing sessionId", { status: 400 });
    }

    const conversations = await sql`
      SELECT user_message, bot_response, created_at
      FROM chat_conversations
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `;

    // Convert database format to UI message format
    const messages = conversations.flatMap((conv: any) => [
      {
        id: `user-${new Date(conv.created_at).getTime()}`,
        role: "user",
        parts: [{ type: "text", text: conv.user_message }],
        createdAt: new Date(conv.created_at).toISOString(),
      },
      {
        id: `assistant-${new Date(conv.created_at).getTime()}`,
        role: "assistant",
        parts: [{ type: "text", text: conv.bot_response }],
        createdAt: new Date(conv.created_at).toISOString(),
      },
    ]);

    return Response.json({ messages });
  } catch (error) {
    console.error("Chat history error:", error);
    return new Response("Error fetching chat history", { status: 500 });
  }
}
