import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";
import { getBlobInfo, deleteImage } from "@/lib/storage";

const sql = neon(process.env.DATABASE_URL!);

interface ImageMetadataRow {
  url: string;
  alt_text: string | null;
  display_name: string | null;
  folder_id: string | null;
  site_id: string | null;
}

interface RouteParams {
  params: Promise<{ url: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { url: urlParam } = await params;
    // urlParam is decoded once by Next.js, giving us the URL with %20 encoding (as stored in DB)
    const dbUrl = urlParam;
    // Decode again for Vercel Blob operations
    const blobUrl = decodeURIComponent(urlParam);

    // Get metadata from database (uses encoded URL as stored)
    const metadataRows = await sql`
      SELECT url, alt_text, display_name, folder_id, site_id FROM image_metadata WHERE url = ${dbUrl}
    ` as ImageMetadataRow[];

    const metadata = metadataRows[0];

    // Check site access
    if (metadata) {
      const isSuperAdmin = ctx!.user.role === "super_admin";
      if (!isSuperAdmin && metadata.site_id && !ctx!.userSites.includes(metadata.site_id)) {
        return NextResponse.json({ error: "Geen toegang tot deze afbeelding" }, { status: 403 });
      }
    }

    // Get blob info from Vercel Blob (needs decoded URL)
    const blobInfo = await getBlobInfo(blobUrl);

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { url: urlParam } = await params;
    // urlParam is decoded once by Next.js, giving us the URL with %20 encoding (as stored in DB)
    const dbUrl = urlParam;
    // Decode again for Vercel Blob operations
    const blobUrl = decodeURIComponent(urlParam);
    const body = await request.json();

    const altText = body.altText || "";
    const displayName = body.displayName || "";

    // Check if image exists and verify site access
    const existing = await sql`
      SELECT site_id FROM image_metadata WHERE url = ${dbUrl}
    `;
    if (existing.length > 0) {
      const isSuperAdmin = ctx!.user.role === "super_admin";
      if (!isSuperAdmin && existing[0].site_id && !ctx!.userSites.includes(existing[0].site_id)) {
        return NextResponse.json({ error: "Geen toegang tot deze afbeelding" }, { status: 403 });
      }
    }

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { url: urlParam } = await params;
    // urlParam is decoded once by Next.js, giving us the URL with %20 encoding (as stored in DB)
    const dbUrl = urlParam;
    // Decode again for Vercel Blob operations (needs actual spaces)
    const blobUrl = decodeURIComponent(urlParam);
    const likePattern = `%${dbUrl}%`;

    // Check site access
    const existing = await sql`
      SELECT site_id FROM image_metadata WHERE url = ${dbUrl}
    `;
    if (existing.length > 0) {
      const isSuperAdmin = ctx!.user.role === "super_admin";
      if (!isSuperAdmin && existing[0].site_id && !ctx!.userSites.includes(existing[0].site_id)) {
        return NextResponse.json({ error: "Geen toegang tot deze afbeelding" }, { status: 403 });
      }
    }

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

// PATCH /api/admin/content/media/[url] - Move image to a folder
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { url: urlParam } = await params;
    const dbUrl = urlParam;
    const { folderId } = await request.json();

    // Check site access
    const existing = await sql`
      SELECT site_id FROM image_metadata WHERE url = ${dbUrl}
    `;
    if (existing.length > 0) {
      const isSuperAdmin = ctx!.user.role === "super_admin";
      if (!isSuperAdmin && existing[0].site_id && !ctx!.userSites.includes(existing[0].site_id)) {
        return NextResponse.json({ error: "Geen toegang tot deze afbeelding" }, { status: 403 });
      }
    }

    // folderId can be null (move to root) or a UUID string
    if (folderId !== null && typeof folderId !== "string") {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    // Upsert the folder_id
    if (folderId === null) {
      await sql`
        INSERT INTO image_metadata (url, folder_id)
        VALUES (${dbUrl}, NULL)
        ON CONFLICT (url) DO UPDATE SET
          folder_id = NULL,
          updated_at = NOW()
      `;
    } else {
      // Verify folder exists and user has access
      const folder = await sql`
        SELECT id, site_id FROM media_folders WHERE id = ${folderId}::uuid
      `;
      if (folder.length === 0) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }

      const isSuperAdmin = ctx!.user.role === "super_admin";
      if (!isSuperAdmin && folder[0].site_id && !ctx!.userSites.includes(folder[0].site_id)) {
        return NextResponse.json({ error: "Geen toegang tot deze map" }, { status: 403 });
      }

      await sql`
        INSERT INTO image_metadata (url, folder_id)
        VALUES (${dbUrl}, ${folderId}::uuid)
        ON CONFLICT (url) DO UPDATE SET
          folder_id = ${folderId}::uuid,
          updated_at = NOW()
      `;
    }

    return NextResponse.json({ success: true, folderId });
  } catch (error) {
    console.error("Failed to move image:", error);
    return NextResponse.json(
      { error: "Failed to move image" },
      { status: 500 }
    );
  }
}
