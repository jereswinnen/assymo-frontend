import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function setupDatabase() {
  try {
    // Create rate_limits table
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMPTZ NOT NULL
      )
    `;

    // Create chat_conversations table for logging
    await sql`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS chat_conversations_session_idx
      ON chat_conversations(session_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS chat_conversations_created_idx
      ON chat_conversations(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS chat_conversations_ip_idx
      ON chat_conversations(ip_address)
    `;

    console.log('✅ Database setup complete (Phase 1)');
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  }
}
