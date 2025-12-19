import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export interface MediaItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  altText: string | null;
  displayName: string | null;
}

interface ImageMetadataRow {
  url: string;
  alt_text: string | null;
  display_name: string | null;
}

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get blobs from Vercel Blob
    const { blobs } = await list();

    // Get metadata from database
    const metadataRows = await sql`
      SELECT url, alt_text, display_name FROM image_metadata
    ` as ImageMetadataRow[];

    const metadataMap = new Map(
      metadataRows.map((row) => [row.url, row])
    );

    // Sort by upload date (newest first) and merge with metadata
    const sortedBlobs: MediaItem[] = blobs
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
      .map((blob) => {
        const metadata = metadataMap.get(blob.url);
        return {
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          altText: metadata?.alt_text || null,
          displayName: metadata?.display_name || null,
        };
      });

    return NextResponse.json(sortedBlobs);
  } catch (error) {
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 }
    );
  }
}
