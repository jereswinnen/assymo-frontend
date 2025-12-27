import { NextRequest, NextResponse } from "next/server";
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
  folderId: string | null;
}

interface ImageMetadataRow {
  url: string;
  alt_text: string | null;
  display_name: string | null;
  folder_id: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get optional folder filter from query params
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    // Get blobs from Vercel Blob
    const { blobs } = await list();

    // Always fetch ALL metadata so we have complete info for every blob
    const allMetadataRows = (await sql`
      SELECT url, alt_text, display_name, folder_id FROM image_metadata
    `) as ImageMetadataRow[];

    const metadataMap = new Map(allMetadataRows.map((row) => [row.url, row]));

    // Sort by upload date (newest first) and merge with metadata
    let sortedBlobs: MediaItem[] = blobs
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
          folderId: metadata?.folder_id || null,
        };
      });

    // Filter based on folder parameter
    if (folderId === "root") {
      // Root: images with no folder_id (including those not in DB yet)
      sortedBlobs = sortedBlobs.filter((blob) => blob.folderId === null);
    } else if (folderId) {
      // Specific folder: only images with matching folder_id
      sortedBlobs = sortedBlobs.filter((blob) => blob.folderId === folderId);
    }
    // No folderId param: return all images (for MediaLibraryDialog)

    return NextResponse.json(sortedBlobs);
  } catch (error) {
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 }
    );
  }
}
