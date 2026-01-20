import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { neon } from '@neondatabase/serverless';
import type { DocumentInfo } from '@/types/chat';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Generate a single embedding using OpenAI's text-embedding-3-small model
 * @param text - Text to embed
 * @returns Embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: openai.embeddingModel('text-embedding-3-small'),
      value: text,
    });

    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Store multiple chunks with their embeddings in the database
 * Uses AI SDK's embedMany for efficient batch processing
 * @param chunks - Array of text chunks to embed and store
 * @param documentName - Name of the source document
 * @param metadata - Additional metadata to store with chunks
 */
export async function storeChunksWithEmbeddings(
  chunks: string[],
  documentName: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);

    // Generate embeddings for all chunks at once using AI SDK's embedMany
    const { embeddings } = await embedMany({
      model: openai.embeddingModel('text-embedding-3-small'),
      values: chunks,
      maxParallelCalls: 2, // Limit concurrent API calls to avoid rate limits
    });

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    console.log(`💾 Storing chunks in database...`);

    // Store each chunk with its embedding
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      await sql`
        INSERT INTO document_chunks (document_name, content, embedding, metadata)
        VALUES (
          ${documentName},
          ${chunk},
          ${JSON.stringify(embedding)}::vector,
          ${JSON.stringify(metadata)}::jsonb
        )
      `;
    }

    // Calculate total characters
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

    // Update document metadata (clear old entry and insert new one)
    await sql`DELETE FROM document_metadata`;
    await sql`
      INSERT INTO document_metadata (document_name, chunk_count, total_characters, metadata)
      VALUES (
        ${documentName},
        ${chunks.length},
        ${totalCharacters},
        ${JSON.stringify(metadata)}::jsonb
      )
    `;

    console.log(`✅ Stored all chunks and metadata successfully`);
  } catch (error) {
    console.error('Store chunks error:', error);
    throw new Error('Failed to store chunks with embeddings');
  }
}

/**
 * Clear all document chunks and metadata from the database
 */
export async function clearAllChunks(): Promise<void> {
  try {
    await sql`TRUNCATE TABLE document_chunks`;
    await sql`DELETE FROM document_metadata`;
    console.log('🗑️ Cleared all document chunks and metadata');
  } catch (error) {
    console.error('Clear chunks error:', error);
    throw new Error('Failed to clear chunks');
  }
}

/**
 * Get information about the currently stored document
 * @returns Document info or null if no document is stored
 */
export async function getDocumentInfo(): Promise<DocumentInfo | null> {
  try {
    const result = await sql`
      SELECT
        document_name,
        chunk_count,
        total_characters,
        uploaded_at,
        metadata
      FROM document_metadata
      ORDER BY uploaded_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      documentName: row.document_name,
      chunkCount: row.chunk_count,
      totalCharacters: row.total_characters,
      uploadedAt: new Date(row.uploaded_at),
      metadata: row.metadata,
    };
  } catch (error) {
    console.error('Get document info error:', error);
    return null;
  }
}
