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

    // Get metadata from database (with optional folder filter)
    let metadataRows: ImageMetadataRow[];

    if (folderId === "root") {
      // Get only root-level images (no folder)
      metadataRows = (await sql`
        SELECT url, alt_text, display_name, folder_id FROM image_metadata
        WHERE folder_id IS NULL
      `) as ImageMetadataRow[];
    } else if (folderId) {
      // Get images in specific folder
      metadataRows = (await sql`
        SELECT url, alt_text, display_name, folder_id FROM image_metadata
        WHERE folder_id = ${folderId}::uuid
      `) as ImageMetadataRow[];
    } else {
      // Get all images (for MediaLibraryDialog)
      metadataRows = (await sql`
        SELECT url, alt_text, display_name, folder_id FROM image_metadata
      `) as ImageMetadataRow[];
    }

    const metadataMap = new Map(metadataRows.map((row) => [row.url, row]));

    // Create a set of URLs that match our folder filter
    const filteredUrls = new Set(metadataRows.map((row) => row.url));

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

    // If filtering by folder, only return matching images
    // For "root" filter, include blobs without metadata (newly uploaded, not yet in DB)
    if (folderId === "root") {
      sortedBlobs = sortedBlobs.filter(
        (blob) => filteredUrls.has(blob.url) || !metadataMap.has(blob.url)
      );
    } else if (folderId) {
      sortedBlobs = sortedBlobs.filter((blob) => filteredUrls.has(blob.url));
    }

    return NextResponse.json(sortedBlobs);
  } catch (error) {
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 }
    );
  }
}
