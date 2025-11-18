import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantChunks } from '@/lib/retrieval';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      );
    }

    // Retrieve relevant chunks (top 3 by default)
    const chunks = await retrieveRelevantChunks(query.trim(), 3);

    return NextResponse.json({
      success: true,
      query: query.trim(),
      chunks,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error('Test retrieval error:', error);

    return NextResponse.json(
      {
        error: 'Failed to test retrieval',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
