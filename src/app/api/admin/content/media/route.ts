import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);

export interface MediaItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  altText: string | null;
  displayName: string | null;
  folderId: string | null;
  siteId: string | null;
}

interface ImageMetadataRow {
  url: string;
  alt_text: string | null;
  display_name: string | null;
  folder_id: string | null;
  site_id: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    // Get optional filters from query params
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const siteId = searchParams.get("siteId");

    const accessibleSites = ctx!.userSites;
    const isSuperAdmin = ctx!.user.role === "super_admin";

    // Verify site access if specific site requested
    if (siteId && !isSuperAdmin && !accessibleSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    // Get blobs from Vercel Blob
    const { blobs } = await list();

    // Fetch metadata based on site access
    let allMetadataRows: ImageMetadataRow[];
    if (siteId) {
      allMetadataRows = (await sql`
        SELECT url, alt_text, display_name, folder_id, site_id FROM image_metadata
        WHERE site_id = ${siteId}
      `) as ImageMetadataRow[];
    } else if (isSuperAdmin) {
      allMetadataRows = (await sql`
        SELECT url, alt_text, display_name, folder_id, site_id FROM image_metadata
      `) as ImageMetadataRow[];
    } else {
      allMetadataRows = (await sql`
        SELECT url, alt_text, display_name, folder_id, site_id FROM image_metadata
        WHERE site_id = ANY(${accessibleSites})
      `) as ImageMetadataRow[];
    }

    const metadataMap = new Map(allMetadataRows.map((row) => [row.url, row]));

    // Filter blobs to only those that exist in accessible metadata
    // This ensures site-scoped media
    let filteredBlobs = blobs.filter((blob) => {
      const metadata = metadataMap.get(blob.url);
      // Only include blobs that have metadata for accessible sites
      return metadata !== undefined;
    });

    // Sort by upload date (newest first) and merge with metadata
    let sortedBlobs: MediaItem[] = filteredBlobs
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
          siteId: metadata?.site_id || null,
        };
      });

    // Filter based on folder parameter
    if (folderId === "root") {
      // Root: images with no folder_id
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
