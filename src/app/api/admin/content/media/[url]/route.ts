import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";
import { getBlobInfo, deleteImage } from "@/lib/storage";

const sql = neon(process.env.DATABASE_URL!);

interface ImageMetadataRow {
  url: string;
  alt_text: string | null;
  display_name: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url: urlParam } = await params;
    // urlParam is decoded once by Next.js, giving us the URL with %20 encoding (as stored in DB)
    const dbUrl = urlParam;
    // Decode again for Vercel Blob operations
    const blobUrl = decodeURIComponent(urlParam);

    // Get blob info from Vercel Blob (needs decoded URL)
    const blobInfo = await getBlobInfo(blobUrl);

    // Get metadata from database (uses encoded URL as stored)
    const metadataRows = await sql`
      SELECT url, alt_text, display_name FROM image_metadata WHERE url = ${dbUrl}
    ` as ImageMetadataRow[];

    const metadata = metadataRows[0];

    return NextResponse.json({
      url: blobInfo.url,
      pathname: blobInfo.pathname,
      size: blobInfo.size,
      uploadedAt: blobInfo.uploadedAt.toISOString(),
      altText: metadata?.alt_text || null,
      displayName: metadata?.display_name || null,
    });
  } catch (error) {
    console.error("Failed to get image:", error);
    return NextResponse.json(
      { error: "Failed to get image" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url: urlParam } = await params;
    // urlParam is decoded once by Next.js, giving us the URL with %20 encoding (as stored in DB)
    const dbUrl = urlParam;
    // Decode again for Vercel Blob operations
    const blobUrl = decodeURIComponent(urlParam);
    const body = await request.json();

    const altText = body.altText || "";
    const displayName = body.displayName || "";

    // Upsert metadata in database (uses encoded URL as stored)
    await sql`
      INSERT INTO image_metadata (url, alt_text, display_name)
      VALUES (${dbUrl}, ${altText}, ${displayName})
      ON CONFLICT (url) DO UPDATE SET
        alt_text = ${altText},
        display_name = ${displayName},
        updated_at = NOW()
    `;

    // Get blob info from Vercel Blob (needs decoded URL)
    const blobInfo = await getBlobInfo(blobUrl);

    return NextResponse.json({
      url: blobInfo.url,
      pathname: blobInfo.pathname,
      size: blobInfo.size,
      uploadedAt: blobInfo.uploadedAt.toISOString(),
      altText,
      displayName,
    });
  } catch (error) {
    console.error("Failed to update image:", error);
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url: urlParam } = await params;
    // urlParam is decoded once by Next.js, giving us the URL with %20 encoding (as stored in DB)
    const dbUrl = urlParam;
    // Decode again for Vercel Blob operations (needs actual spaces)
    const blobUrl = decodeURIComponent(urlParam);
    const likePattern = `%${dbUrl}%`;

    console.log("Checking references for URL:", dbUrl);

    // Check if image is in use
    const references = await sql`
      SELECT 'page' as type, id, title as name FROM pages
      WHERE header_image::text LIKE ${likePattern}
         OR sections::text LIKE ${likePattern}
      UNION ALL
      SELECT 'solution' as type, id, name FROM solutions
      WHERE header_image::text LIKE ${likePattern}
         OR sections::text LIKE ${likePattern}
      LIMIT 1
    `;

    console.log("References found:", references.length, references);

    if (references.length > 0) {
      return NextResponse.json(
        { error: "Afbeelding is nog in gebruik. Verwijder eerst de referenties." },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob (needs decoded URL)
    await deleteImage(blobUrl);

    // Delete metadata from database (uses encoded URL as stored)
    await sql`DELETE FROM image_metadata WHERE url = ${dbUrl}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
