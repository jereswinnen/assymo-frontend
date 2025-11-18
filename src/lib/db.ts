import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function setupDatabase() {
  try {
    // Enable pgvector extension for embeddings (Phase 2)
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;

    // Create rate_limits table (Phase 1)
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMPTZ NOT NULL
      )
    `;

    // Create chat_conversations table for logging (Phase 1)
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

    // Create indexes for performance (Phase 1)
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

    // Create document_chunks table for embeddings (Phase 2)
    await sql`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_name TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for vector similarity search (Phase 2)
    await sql`
      CREATE INDEX IF NOT EXISTS embedding_idx
      ON document_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `;

    // Create document_metadata table (Phase 2)
    await sql`
      CREATE TABLE IF NOT EXISTS document_metadata (
        id SERIAL PRIMARY KEY,
        document_name TEXT NOT NULL,
        chunk_count INTEGER NOT NULL,
        total_characters INTEGER NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `;

    console.log('✅ Database setup complete (Phase 1 + Phase 2)');
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  }
}
