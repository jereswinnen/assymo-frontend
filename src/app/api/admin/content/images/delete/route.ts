import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-utils";
import { deleteImage } from "@/lib/storage";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    console.log("Checking references for URL:", url, "Found:", references.length);

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
