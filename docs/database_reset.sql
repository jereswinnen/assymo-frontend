-- ============================================
-- RESET DATABASE - ASSYMO CHATBOT
-- Phase 1 + Phase 2 Complete Schema
-- ============================================

-- Drop all existing tables (clean slate)
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS document_metadata CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PHASE 1 TABLES
-- ============================================

-- Rate limiting table
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL
);

-- Chat conversations logging
CREATE TABLE chat_conversations (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chat_conversations
CREATE INDEX chat_conversations_session_idx ON chat_conversations(session_id);
CREATE INDEX chat_conversations_created_idx ON chat_conversations(created_at DESC);
CREATE INDEX chat_conversations_ip_idx ON chat_conversations(ip_address);

-- ============================================
-- PHASE 2 TABLES
-- ============================================

-- Document chunks with embeddings (vector storage)
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  document_name TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for vector similarity search (cosine distance)
CREATE INDEX embedding_idx ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Document metadata (single row, current document info)
CREATE TABLE document_metadata (
  id SERIAL PRIMARY KEY,
  document_name TEXT NOT NULL,
  chunk_count INTEGER NOT NULL,
  total_characters INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify pgvector extension enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
