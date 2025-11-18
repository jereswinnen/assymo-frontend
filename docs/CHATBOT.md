# Chatbot Implementation Guide

## Architecture Overview

**Approach**: RAG (Retrieval-Augmented Generation) with Neon PostgreSQL

- **Message Persistence**: 7-day expiry in localStorage (client-side UX)
- **Rate Limiting**: Server-side using Neon database (10 messages / 24h)
- **Knowledge Base**: PDF documents embedded with OpenAI, stored in Neon with pgvector
- **Philosophy**: Clean separation of concerns across three implementation phases

## Implementation Phases

### Phase 1: Basic Chat with OpenAI ✅ COMPLETE
Frontend chat interface with OpenAI streaming responses and rate limiting.

### Phase 2: RAG with PDF Embeddings 🔜 (NEXT)
Admin panel for PDF upload, text extraction, embedding generation, and vector storage.

### Phase 3: Chat History Viewer 🔜 (AFTER PHASE 2)
Admin panel to view and analyze past user conversations.

---

## Storage Schema

### localStorage (Client-Side)

```typescript
// Message history
"chatbot_messages": Message[]

// Session tracking
"chatbot_session": ChatSession
```

### Neon Database Tables

```sql
-- Rate limiting (Phase 1)
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL
);

-- Chat conversations logging (Phase 1)
CREATE TABLE chat_conversations (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document embeddings (Phase 2)
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Types

```typescript
// src/types/chat.ts
export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type ChatSession = {
  sessionId: string;
  createdAt: Date;
  messageCount: number;
};
```

## File Structure

```
src/
├── types/
│   └── chat.ts                    # Message & ChatSession types
├── lib/
│   ├── chatSession.ts             # Session ID management
│   ├── db.ts                      # Database setup utilities
│   ├── rateLimit.ts               # Rate limiting logic
│   ├── pdfProcessor.ts            # PDF text extraction (Phase 2)
│   ├── embeddings.ts              # OpenAI embeddings (Phase 2)
│   └── retrieval.ts               # Vector search (Phase 2)
├── hooks/
│   └── usePersistedChat.ts        # Persistence hook
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Chat API with streaming
│   │   └── admin/
│   │       ├── ingest-pdf/route.ts    # PDF upload (Phase 2)
│   │       └── chat-history/route.ts  # History API (Phase 3)
│   └── admin/
│       ├── pdf-upload/page.tsx    # PDF admin UI (Phase 2)
│       └── chat-history/page.tsx  # History viewer (Phase 3)
└── components/
    ├── Chatbot.tsx                # Chat UI
    └── ChatbotWidget.tsx          # Toggle wrapper
```

---

## PHASE 1: Basic Chat with OpenAI Integration

### Prerequisites

Install dependencies (done, please skip!):

```bash
pnpm add ai @ai-sdk/react @ai-sdk/openai zod @neondatabase/serverless
```

### Environment Variables

Create `.env.local` (done, please skip!):

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Neon Database
DATABASE_URL=your_neon_database_url

# Admin (for Phase 2)
ADMIN_SECRET=your_strong_secret_key
```

### Step 1: Database Setup

Create `src/lib/db.ts`:

```typescript
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

// Run once to set up tables
// You can call this from a script or manually
```

### Step 2: Rate Limiting with Neon

Create `src/lib/rateLimit.ts`:

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function checkRateLimit(
  sessionId: string,
  maxRequests: number = 10,
  windowSeconds: number = 86400 // 24 hours
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    // Get or create rate limit entry
    const result = await sql`
      WITH current_limit AS (
        SELECT count, window_start
        FROM rate_limits
        WHERE key = ${sessionId}
      ),
      window_check AS (
        SELECT 
          COALESCE(count, 0) as current_count,
          COALESCE(window_start, NOW()) as start_time,
          (COALESCE(window_start, NOW()) + INTERVAL '1 second' * ${windowSeconds}) <= NOW() as expired
        FROM current_limit
      )
      SELECT 
        current_count,
        start_time,
        expired,
        EXTRACT(EPOCH FROM (start_time + INTERVAL '1 second' * ${windowSeconds}))::BIGINT as reset_time
      FROM window_check
    `;

    const { current_count, expired, reset_time } = result[0];

    // Window expired, reset counter
    if (expired || current_count === 0) {
      await sql`
        INSERT INTO rate_limits (key, count, window_start)
        VALUES (${sessionId}, 1, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET count = 1, window_start = NOW()
      `;
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowSeconds * 1000,
      };
    }

    // Check if limit exceeded
    if (current_count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: reset_time * 1000,
      };
    }

    // Increment counter
    await sql`
      UPDATE rate_limits 
      SET count = count + 1 
      WHERE key = ${sessionId}
    `;

    return {
      allowed: true,
      remaining: maxRequests - current_count - 1,
      resetTime: reset_time * 1000,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowSeconds * 1000,
    };
  }
}
```

### Step 3: Chat API Route

Create `app/api/chat/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from '@/types/chat';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { neon } from '@neondatabase/serverless';

export const maxDuration = 30;

const sql = neon(process.env.DATABASE_URL!);

const SYSTEM_PROMPT = `Je bent een behulpzame klantenservice chatbot voor Assymo. 
Beantwoord vragen over houten tuingebouwen, zoals tuinhuisjes, overkappingen, pergola's, carports en schuren.

Wees professioneel, behulpzaam en bondig in het Nederlands.`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { messages, sessionId }: { messages: Message[]; sessionId: string } = 
      await req.json();

    if (!messages || !sessionId) {
      return new Response('Missing messages or sessionId', { status: 400 });
    }

    // Get IP address for logging
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';

    // Check rate limit (10 messages per 24 hours)
    const rateLimitResult = await checkRateLimit(sessionId, 10, 86400);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          remaining: 0,
        }),
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get last user message
    const lastUserMessage = messages[messages.length - 1];

    // Convert messages to AI SDK format
    const coreMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Stream response from OpenAI
    const result = streamText({
      model: openai('gpt-5-nano-2025-08-07'),
      system: SYSTEM_PROMPT,
      messages: convertToCoreMessages(messages as any),
    });

    // Get the full response text for logging
    const fullText = await result.text;
    const responseTime = Date.now() - startTime;

    // Log conversation to database (non-blocking)
    sql`
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
        ${lastUserMessage.content}, 
        ${fullText}, 
        ${responseTime}
      )
    `.catch(err => console.error('Failed to log conversation:', err));

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Error processing chat', { status: 500 });
  }
}
```

### Step 4: Update Chatbot Component

Update `src/components/Chatbot.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, Plus as IconPlus, Trash2, X } from "lucide-react";
import { useChat } from '@ai-sdk/react';
import { InputGroup, InputGroupTextarea, InputGroupAddon, InputGroupButton, InputGroupText } from "@/components/ui/input-group";
import { usePersistedChat } from "@/hooks/usePersistedChat";
import type { Message } from "@/types/chat";
import { clearSession, getSessionId } from "@/lib/chatSession";

interface ChatbotProps {
  onClose?: () => void;
}

export default function Chatbot({ onClose }: ChatbotProps = {}) {
  const { messages, addMessage, clearMessages, isHydrated } = usePersistedChat();
  const [inputValue, setInputValue] = useState("");
  const [rateLimitError, setRateLimitError] = useState<{
    resetTime: number;
    remaining: number;
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputValue("");
    setRateLimitError(null);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId: getSessionId(),
        }),
      });

      if (response.status === 429) {
        const errorData = await response.json();
        setRateLimitError(errorData);
        setIsStreaming(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantContent += chunk;
        }

        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantContent,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearConversation = () => {
    clearMessages();
    clearSession();
    setRateLimitError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getTimeUntilReset = () => {
    if (!rateLimitError) return "";
    const now = Date.now();
    const resetTime = rateLimitError.resetTime;
    const diff = resetTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}u ${minutes}m`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between text-foreground p-4 border-b">
        <p className="!mb-0 text-xl font-semibold">Chat</p>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Wis gesprek"
              title="Wis gesprek"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 bg-muted text-muted-foreground rounded-full transition-colors"
              aria-label="Sluit chat"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`text-base flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className={`max-w-[70%]`}>
              <div
                className={`rounded-2xl ${
                  message.role === "user"
                    ? "p-3 bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                <p>{message.content}</p>
              </div>
              <div
                className={`text-xs text-muted-foreground ${
                  message.role === "user" ? "text-right mt-1" : "text-left mt-2"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex space-x-2 p-3">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        {rateLimitError ? (
          <div className="text-center text-muted-foreground p-4">
            <p className="font-semibold">Rate limit bereikt (10 berichten / 24u)</p>
            <p className="text-sm mt-1">Reset over {getTimeUntilReset()}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <InputGroup>
              <InputGroupTextarea
                ref={textareaRef}
                placeholder="Waarmee kunnen we je helpen?"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={isStreaming}
              />
              <InputGroupAddon align="block-end">
                <InputGroupButton
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  size="icon-xs"
                >
                  <IconPlus />
                </InputGroupButton>
                <InputGroupText className="ml-auto">
                  {messages.filter(m => m.role === 'user').length} / 10
                </InputGroupText>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  className="rounded-full"
                  size="icon-xs"
                  disabled={!inputValue.trim() || isStreaming}
                >
                  <ArrowUpIcon />
                  <span className="sr-only">Verstuur bericht</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        )}
      </div>
    </div>
  );
}
```

### Step 5: Simple Admin Viewer (Optional)

Create `app/admin/conversations/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';

type Conversation = {
  id: number;
  session_id: string;
  ip_address: string;
  user_message: string;
  bot_response: string;
  response_time_ms: number;
  created_at: string;
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Recent Conversations</h1>

      <div className="space-y-4">
        {conversations.map((conv) => (
          <div key={conv.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span>Session: {conv.session_id.substring(0, 8)}...</span>
              <span>{new Date(conv.created_at).toLocaleString()}</span>
            </div>

            <div className="mb-2">
              <div className="text-sm font-semibold text-blue-700">User:</div>
              <div className="text-sm bg-blue-50 p-2 rounded">{conv.user_message}</div>
            </div>

            <div className="mb-2">
              <div className="text-sm font-semibold text-green-700">Bot:</div>
              <div className="text-sm bg-green-50 p-2 rounded">{conv.bot_response}</div>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>IP: {conv.ip_address}</span>
              <span>Response time: {conv.response_time_ms}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Create `app/api/admin/conversations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    // Simple auth check (optional)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await sql`
      SELECT *
      FROM chat_conversations
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
```

### Testing Phase 1

1. Set up Neon database and add `DATABASE_URL` to `.env.local`
2. Add `OPENAI_API_KEY` to `.env.local`
3. Run `setupDatabase()` once to create tables
4. Start dev server: `pnpm dev`
5. Navigate to `/feat-chatbot` and test the chat
6. Verify rate limiting works after 10 messages
7. Check `/admin/conversations` to see logged chats

**Phase 1 Complete!** Users can chat with OpenAI, and conversations are logged to Neon.

---

## PHASE 2: RAG with PDF Embeddings

This phase implements a RAG (Retrieval-Augmented Generation) system using the **AI SDK's built-in embedding functions**. We'll use OpenAI's **`text-embedding-3-small`** model (1536 dimensions) to generate embeddings from PDF documents.

### Prerequisites

Install additional dependencies (already done!):

```bash
pnpm add pdf-parse
```

### Step 1: Extend Database Schema

Update `src/lib/db.ts`:

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function setupDatabase() {
  try {
    // Rate limits table (from Phase 1)
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMPTZ NOT NULL
      )
    `;

    // Enable pgvector extension
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;

    // Document chunks table for embeddings
    await sql`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for faster similarity search
    await sql`
      CREATE INDEX IF NOT EXISTS embedding_idx 
      ON document_chunks 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `;

    console.log('✅ Database setup complete (Phase 2)');
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  }
}
```

### Step 2: PDF Processing

Create `src/lib/pdfProcessor.ts`:

```typescript
import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  const data = await pdfParse(pdfBuffer);
  return data.text;
}

export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start + chunkSize * 0.5) {
        end = lastPeriod + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}
```

### Step 3: Embeddings Generation with AI SDK

Create `src/lib/embeddings.ts`:

```typescript
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Generate a single embedding using AI SDK
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    value: text,
  });

  return embedding;
}

// Store multiple chunks with embeddings (uses embedMany for efficiency)
export async function storeChunksWithEmbeddings(
  chunks: string[],
  metadata: Record<string, any> = {}
): Promise<void> {
  // Generate embeddings for all chunks at once using AI SDK's embedMany
  const { embeddings } = await embedMany({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    values: chunks,
    maxParallelCalls: 2, // Limit concurrent API calls
  });

  // Store each chunk with its embedding
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    await sql`
      INSERT INTO document_chunks (content, embedding, metadata)
      VALUES (
        ${chunk},
        ${JSON.stringify(embedding)}::vector,
        ${JSON.stringify(metadata)}::jsonb
      )
    `;
  }
}

export async function clearAllChunks(): Promise<void> {
  await sql`TRUNCATE TABLE document_chunks`;
}
```

### Step 4: Vector Retrieval

Create `src/lib/retrieval.ts`:

```typescript
import { neon } from '@neondatabase/serverless';
import { generateEmbedding } from './embeddings';

const sql = neon(process.env.DATABASE_URL!);

export async function retrieveRelevantChunks(
  query: string,
  limit: number = 3
): Promise<string[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar chunks using cosine similarity
    const results = await sql`
      SELECT content
      FROM document_chunks
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    return results.map(row => row.content);
  } catch (error) {
    console.error('Retrieval error:', error);
    return [];
  }
}
```

### Step 5: PDF Upload API

Create `app/api/admin/ingest-pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, chunkText } from '@/lib/pdfProcessor';
import { storeChunksWithEmbeddings, clearAllChunks } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    console.log('📄 Processing PDF:', file.name);

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const text = await extractTextFromPDF(buffer);
    console.log(`✅ Extracted ${text.length} characters`);

    // Chunk text
    const chunks = chunkText(text, 500, 100);
    console.log(`✂️ Created ${chunks.length} chunks`);

    // Clear old embeddings
    await clearAllChunks();
    console.log('🗑️ Cleared old embeddings');

    // Store with embeddings
    await storeChunksWithEmbeddings(chunks, {
      source: file.name,
      uploadedAt: new Date().toISOString(),
    });
    console.log('✅ Stored all embeddings');

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${chunks.length} chunks`,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error('PDF ingestion error:', error);
    return NextResponse.json(
      { error: 'PDF processing failed', details: String(error) },
      { status: 500 }
    );
  }
}
```

### Step 6: Update Chat API with RAG

Update `app/api/chat/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from '@/types/chat';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { retrieveRelevantChunks } from '@/lib/retrieval';

export const maxDuration = 30;

const SYSTEM_PROMPT_TEMPLATE = `Je bent een behulpzame klantenservice chatbot voor Assymo.
Je hebt toegang tot informatie over onze diensten, prijzen en werkwijze.

BELANGRIJKE REGELS:
1. Beantwoord alleen vragen op basis van de verstrekte bedrijfsinformatie
2. Als een gebruiker iets vraagt dat niet gerelateerd is aan ons bedrijf, wijs dit beleefd af
3. Wees professioneel, behulpzaam en bondig in het Nederlands
4. Als je niet genoeg informatie hebt, geef dit eerlijk toe

Relevante bedrijfsinformatie:
---
{CONTEXT}
---

Baseer je antwoorden ALLEEN op bovenstaande informatie.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId }: { messages: Message[]; sessionId: string } = 
      await req.json();

    if (!messages || !sessionId) {
      return new Response('Missing messages or sessionId', { status: 400 });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(sessionId, 10, 86400);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          remaining: 0,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get last user message
    const lastMessage = messages[messages.length - 1];
    
    // Retrieve relevant chunks from vector database
    const relevantChunks = await retrieveRelevantChunks(lastMessage.content, 3);
    const context = relevantChunks.join('\n\n');

    // Prepare system prompt with context
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
      '{CONTEXT}',
      context || 'Geen specifieke informatie gevonden.'
    );

    // Convert messages
    const coreMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Stream response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: convertToCoreMessages(coreMessages),
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Error processing chat', { status: 500 });
  }
}
```

### Step 7: Admin PDF Upload Page (instead, integrate this on the admin dashboard)

Create `app/admin/pdf-upload/page.tsx`:

```typescript
'use client';

import { useState } from 'react';

export default function PDFUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/admin/ingest-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">PDF Upload & Embedding</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select PDF File
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm border rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Processing...' : 'Upload & Process PDF'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-lg ${result.error ? 'bg-red-100' : 'bg-green-100'}`}>
          {result.error ? (
            <>
              <h3 className="font-bold text-red-800">Error</h3>
              <p className="text-red-700">{result.error}</p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-green-800">Success!</h3>
              <p className="text-green-700">{result.message}</p>
              <p className="text-sm text-green-600 mt-2">
                Processed {result.chunksCount} chunks
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

Add `NEXT_PUBLIC_ADMIN_SECRET` to `.env.local`.

### Testing Phase 2

1. Run updated `setupDatabase()` to create new tables
2. Navigate to `/admin/pdf-upload`
3. Upload your business PDF
4. Test chatbot - it should now answer based on PDF content
5. Ask questions outside PDF scope - should decline politely

**Phase 2 Complete!** Chatbot now uses your PDF knowledge base.

---

## PHASE 3: Chat History Viewer

### Step 1: Extend Database Schema

Update `src/lib/db.ts` to add chat history table:

```typescript
export async function setupDatabase() {
  // ... previous tables ...

  // Chat history table
  await sql`
    CREATE TABLE IF NOT EXISTS chat_history (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_query TEXT NOT NULL,
      bot_response TEXT NOT NULL,
      chunks_used INTEGER,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS chat_history_session_idx 
    ON chat_history(session_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS chat_history_created_idx 
    ON chat_history(created_at DESC)
  `;

  console.log('✅ Database setup complete (Phase 3)');
}
```

### Step 2: Log Chat Interactions

Update `app/api/chat/route.ts` to log conversations:

```typescript
// Add after streaming response
async function logChatHistory(
  sessionId: string,
  userQuery: string,
  botResponse: string,
  chunksUsed: number,
  ipAddress: string
) {
  try {
    await sql`
      INSERT INTO chat_history (session_id, user_query, bot_response, chunks_used, ip_address)
      VALUES (${sessionId}, ${userQuery}, ${botResponse}, ${chunksUsed}, ${ipAddress})
    `;
  } catch (error) {
    console.error('Failed to log chat history:', error);
  }
}

// In POST handler, after getting response:
const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
// ... after streaming completes ...
await logChatHistory(sessionId, lastMessage.content, fullResponse, relevantChunks.length, ip);
```

### Step 3: Chat History API

Create `app/api/admin/chat-history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conversations = await sql`
      SELECT 
        id,
        session_id,
        user_query,
        bot_response,
        chunks_used,
        ip_address,
        created_at
      FROM chat_history
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const total = await sql`SELECT COUNT(*) as count FROM chat_history`;

    return NextResponse.json({
      conversations,
      total: total[0].count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
```

### Step 4: Chat History Viewer Page

Create `app/admin/chat-history/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

type Conversation = {
  id: number;
  session_id: string;
  user_query: string;
  bot_response: string;
  chunks_used: number;
  ip_address: string;
  created_at: string;
};

export default function ChatHistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadConversations();
  }, [page]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/chat-history?limit=${pageSize}&offset=${page * pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
          },
        }
      );
      const data = await response.json();
      setConversations(data.conversations);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Chat History</h1>

      <div className="mb-4 text-sm text-gray-600">
        Total conversations: {total}
      </div>

      <div className="space-y-4">
        {conversations.map((conv) => (
          <div key={conv.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="text-xs text-gray-500">
                Session: {conv.session_id.substring(0, 8)}...
              </div>
              <div className="text-xs text-gray-500">
                {new Date(conv.created_at).toLocaleString()}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-semibold text-blue-700 mb-1">User:</div>
              <div className="text-sm bg-blue-50 p-2 rounded">{conv.user_query}</div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-semibold text-green-700 mb-1">Bot:</div>
              <div className="text-sm bg-green-50 p-2 rounded">{conv.bot_response}</div>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Chunks used: {conv.chunks_used}</span>
              <span>IP: {conv.ip_address}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {page + 1} of {Math.ceil(total / pageSize)}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={(page + 1) * pageSize >= total}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Testing Phase 3

1. Run updated `setupDatabase()` to create chat_history table
2. Have some conversations with the chatbot
3. Navigate to `/admin/chat-history`
4. View past conversations with pagination
5. Verify IP addresses and chunk usage are tracked

**Phase 3 Complete!** Full admin panel with PDF management and chat history.

---

## Testing Checklist

### Phase 1
- [ ] Messages persist across page navigation
- [ ] Messages persist after browser close/reopen
- [ ] Messages expire after 7 days
- [ ] Clear conversation button works
- [ ] Session ID persists correctly
- [ ] Streaming responses work correctly
- [ ] Rate limiting triggers at 10 messages
- [ ] Rate limit countdown displays correctly
- [ ] Conversations logged to Neon database
- [ ] Admin viewer shows recent conversations
- [ ] IP addresses and response times tracked

### Phase 2
- [ ] PDF upload processes successfully
- [ ] Embeddings stored in Neon
- [ ] Vector search returns relevant chunks
- [ ] Chatbot answers from PDF content
- [ ] Chatbot declines off-topic questions

### Phase 3
- [ ] Chat conversations logged to database
- [ ] History viewer displays conversations
- [ ] Pagination works correctly
- [ ] Session tracking works
- [ ] IP addresses logged correctly

## Helpful Resources

- [Vercel AI SDK Docs](https://ai-sdk.dev/docs)
- [Neon Database Docs](https://neon.tech/docs)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## Notes

- **Rate limiting**: 10 messages per 24 hours per session
- **Message persistence**: 7 days in localStorage
- **Embeddings model**: text-embedding-3-small (1536 dimensions)
- **Chat model**: gpt-5-nano-2025-08-07 (cost-effective)
- **Vector search**: Cosine similarity with pgvector
- **Security**: Admin endpoints protected with Bearer token
