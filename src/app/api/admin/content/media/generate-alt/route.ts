import { NextRequest, NextResponse, after } from "next/server";
import { protectRoute } from "@/lib/permissions";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { neon } from "@neondatabase/serverless";
import { CHATBOT_CONFIG } from "@/config/chatbot";

const sql = neon(process.env.DATABASE_URL!);

async function generateAltTextInBackground(
  imageUrl: string,
  fileName: string
): Promise<void> {
  // Wait a moment for blob to propagate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to fetch image for alt text:", imageUrl);
      return;
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Generate alt text
    const { text } = await generateText({
      model: openai(CHATBOT_CONFIG.model),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Maak een beknopte alt-tekst voor deze afbeelding in het Nederlands. Wees bondig. Gebruik alleen bijvoeglijke naamwoorden als dat nodig is. Maximaal 160 tekens. Gebruik eenvoudige taal. Antwoord alleen met de alt-tekst, niets anders.",
            },
            {
              type: "image",
              image: dataUrl,
            },
          ],
        },
      ],
    });

    const altText = text.trim();

    await sql`
      UPDATE image_metadata
      SET alt_text = ${altText}, updated_at = NOW()
      WHERE url = ${imageUrl}
    `;

    console.log("Alt text generated:", altText);
  } catch (error) {
    console.error("Alt text generation failed:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { url, fileName, folderId, siteId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate siteId
    if (!siteId) {
      return NextResponse.json({ error: "Site is required" }, { status: 400 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    // Validate folderId if provided
    const validFolderId = folderId && typeof folderId === "string" ? folderId : null;

    // If folderId is provided, verify it belongs to the same site
    if (validFolderId) {
      const folder = await sql`
        SELECT site_id FROM media_folders WHERE id = ${validFolderId}::uuid
      `;
      if (folder.length === 0) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
      if (folder[0].site_id !== siteId) {
        return NextResponse.json({ error: "Folder belongs to a different site" }, { status: 400 });
      }
    }

    // Save metadata immediately so image shows up
    const displayName = fileName || url.split("/").pop() || "";
    if (validFolderId) {
      await sql`
        INSERT INTO image_metadata (url, display_name, folder_id, site_id)
        VALUES (${url}, ${displayName}, ${validFolderId}::uuid, ${siteId})
        ON CONFLICT (url) DO UPDATE SET
          display_name = COALESCE(image_metadata.display_name, ${displayName}),
          folder_id = COALESCE(image_metadata.folder_id, ${validFolderId}::uuid),
          site_id = COALESCE(image_metadata.site_id, ${siteId}),
          updated_at = NOW()
      `;
    } else {
      await sql`
        INSERT INTO image_metadata (url, display_name, site_id)
        VALUES (${url}, ${displayName}, ${siteId})
        ON CONFLICT (url) DO UPDATE SET
          display_name = COALESCE(image_metadata.display_name, ${displayName}),
          site_id = COALESCE(image_metadata.site_id, ${siteId}),
          updated_at = NOW()
      `;
    }

    // Generate alt text in background after response is sent
    after(async () => {
      await generateAltTextInBackground(url, displayName);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Metadata creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create image metadata" },
      { status: 500 }
    );
  }
}
