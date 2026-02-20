import { sql } from '@/lib/db';
import { generateEmbedding } from './embeddings';

/**
 * Retrieve the most relevant text chunks for a given query using vector similarity search
 * @param query - User's query text
 * @param limit - Number of chunks to retrieve (default: 3)
 * @returns Array of relevant text chunks, ordered by relevance (most relevant first)
 */
export async function retrieveRelevantChunks(
  query: string,
  limit: number = 3
): Promise<string[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // IMPORTANT: Store JSON.stringify result in a variable before using in SQL template
    // Inline function calls don't work correctly with Neon's SQL template literals
    const embeddingJson = JSON.stringify(queryEmbedding);

    // Search for similar chunks using cosine similarity
    // The <=> operator calculates cosine distance (lower is more similar)
    const results = await sql`
      SELECT content
      FROM document_chunks
      ORDER BY embedding <=> ${embeddingJson}::vector
      LIMIT ${limit}
    `;

    // Extract just the content from results
    return results.map(row => row.content);
  } catch (error) {
    console.error('Retrieval error:', error);
    // Return empty array on error to allow graceful degradation
    return [];
  }
}

/**
 * Check if any documents are currently stored in the database
 * @returns True if documents exist, false otherwise
 */
export async function hasDocuments(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM document_chunks
    `;

    return result[0].count > 0;
  } catch (error) {
    console.error('Has documents check error:', error);
    return false;
  }
}
