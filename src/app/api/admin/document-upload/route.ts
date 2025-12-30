import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile, chunkText } from '@/lib/documentProcessor';
import { storeChunksWithEmbeddings, clearAllChunks } from '@/lib/embeddings';
import { protectRoute } from '@/lib/permissions';

export const maxDuration = 300; // 5 minutes for large documents

export async function DELETE(req: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "conversations" });
    if (!authorized) return response;

    // Clear all chunks and metadata
    await clearAllChunks();

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 Document upload started');

    const { authorized, response } = await protectRoute({ feature: "conversations" });
    if (!authorized) {
      console.log('❌ Unauthorized access attempt');
      return response;
    }

    console.log('✅ Authentication passed');

    const formData = await req.formData();
    const file = formData.get('document') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (only Markdown)
    const fileName = file.name.toLowerCase();
    const isValidFile = fileName.endsWith('.md');

    if (!isValidFile) {
      console.log('❌ Invalid file type:', file.name);
      return NextResponse.json({ error: 'File must be Markdown (.md)' }, { status: 400 });
    }

    console.log('📄 Processing file:', file.name, `(${file.size} bytes)`);

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ Converted to buffer:', buffer.length, 'bytes');

    // Extract text from file
    console.log('🔄 Extracting text from document...');
    const text = await extractTextFromFile(buffer);
    console.log(`✅ Extracted ${text.length} characters`);

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Document appears to be empty or contains too little text' },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(text, 500, 100);
    console.log(`✂️ Created ${chunks.length} text chunks`);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create chunks from document text' },
        { status: 400 }
      );
    }

    // Clear old embeddings
    await clearAllChunks();
    console.log('🗑️ Cleared previous document');

    // Store chunks with embeddings
    await storeChunksWithEmbeddings(chunks, file.name, {
      source: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });

    console.log('✅ Document processing complete');

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${file.name}`,
      documentName: file.name,
      chunkCount: chunks.length,
      totalCharacters: text.length,
    });
  } catch (error) {
    console.error('Document upload error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Document processing failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
