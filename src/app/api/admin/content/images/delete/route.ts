import { NextResponse } from "next/server";
import { protectRoute } from "@/lib/permissions";
import { deleteImage } from "@/lib/storage";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { authorized, response } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Check if image is in use
    const likePattern = `%${url}%`;
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

    // Delete from Vercel Blob
    await deleteImage(url);

    // Delete metadata from database
    await sql`DELETE FROM image_metadata WHERE url = ${url}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image deletion failed:", error);
    return NextResponse.json(
      { error: "Deletion failed" },
      { status: 500 }
    );
  }
}
