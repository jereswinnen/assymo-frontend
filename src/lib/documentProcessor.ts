/**
 * Extract text content from a markdown file buffer
 * @param fileBuffer - File as Buffer
 * @returns Extracted text content
 */
export async function extractTextFromFile(fileBuffer: Buffer): Promise<string> {
  try {
    // Simply decode the buffer as UTF-8 text
    const text = fileBuffer.toString('utf-8');
    return text;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
}

/**
 * Split text into chunks with overlap for better context preservation
 * @param text - Text to chunk
 * @param chunkSize - Maximum characters per chunk (default: 500)
 * @param overlap - Characters to overlap between chunks (default: 100)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  let start = 0;

  // Clean up the text
  const cleanText = text.replace(/\s+/g, ' ').trim();

  while (start < cleanText.length) {
    let end = start + chunkSize;

    // If not at the end, try to break at sentence boundary
    if (end < cleanText.length) {
      // Look for sentence endings (., !, ?)
      const lastPeriod = cleanText.lastIndexOf('.', end);
      const lastExclamation = cleanText.lastIndexOf('!', end);
      const lastQuestion = cleanText.lastIndexOf('?', end);

      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

      // Only use sentence boundary if it's not too far back (at least 50% of chunk size)
      if (lastSentenceEnd > start + chunkSize * 0.5) {
        end = lastSentenceEnd + 1;
      }
    }

    const chunk = cleanText.slice(start, end).trim();

    // Only add non-empty chunks
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start position with overlap
    start = end - overlap;

    // Prevent infinite loop if chunk is too small
    if (start <= end - chunkSize && end >= cleanText.length) {
      break;
    }
  }

  return chunks;
}
