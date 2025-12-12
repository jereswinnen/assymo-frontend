import { NextRequest, NextResponse } from 'next/server';
import { getDocumentInfo } from '@/lib/embeddings';
import { isAuthenticated } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    // Check authentication via session cookie
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current document info
    const documentInfo = await getDocumentInfo();

    if (!documentInfo) {
      return NextResponse.json({
        success: true,
        document: null,
      });
    }

    return NextResponse.json({
      success: true,
      document: {
        documentName: documentInfo.documentName,
        chunkCount: documentInfo.chunkCount,
        totalCharacters: documentInfo.totalCharacters,
        uploadedAt: documentInfo.uploadedAt.toISOString(),
        metadata: documentInfo.metadata,
      },
    });
  } catch (error) {
    console.error('Document info error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch document information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
