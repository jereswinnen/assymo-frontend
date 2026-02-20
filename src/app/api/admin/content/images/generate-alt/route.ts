import { NextResponse, after } from "next/server";
import { protectRoute } from "@/lib/permissions";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { sql } from "@/lib/db";
import { CHATBOT_CONFIG } from "@/config/chatbot";

async function generateAndSaveAltText(
  imageUrl: string,
  fileName: string,
  folderId: string | null,
  siteId: string,
  imageBase64: string
): Promise<void> {
  // First, save metadata immediately so the image shows up
  try {
    if (folderId) {
      await sql`
        INSERT INTO image_metadata (url, display_name, folder_id, site_id)
        VALUES (${imageUrl}, ${fileName}, ${folderId}::uuid, ${siteId})
        ON CONFLICT (url) DO UPDATE SET
          display_name = COALESCE(image_metadata.display_name, ${fileName}),
          folder_id = COALESCE(image_metadata.folder_id, ${folderId}::uuid),
          site_id = COALESCE(image_metadata.site_id, ${siteId}),
          updated_at = NOW()
      `;
    } else {
      await sql`
        INSERT INTO image_metadata (url, display_name, site_id)
        VALUES (${imageUrl}, ${fileName}, ${siteId})
        ON CONFLICT (url) DO UPDATE SET
          display_name = COALESCE(image_metadata.display_name, ${fileName}),
          site_id = COALESCE(image_metadata.site_id, ${siteId}),
          updated_at = NOW()
      `;
    }
  } catch (error) {
    console.error("Failed to save image metadata:", error);
    return;
  }

  // Then generate alt text
  try {
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
              image: imageBase64,
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
    // Metadata is already saved, so image will still show up
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;
    const { url, fileName, folderId, siteId } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!siteId) {
      return NextResponse.json({ error: "Site is required" }, { status: 400 });
    }

    // Verify site access
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    // Fetch image and convert to base64 before background task
    // (avoids timing issues where OpenAI can't download fresh blob URLs)
    let imageBase64: string;
    try {
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      imageBase64 = `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error("Failed to fetch image for base64:", error);
      return NextResponse.json({ error: "Failed to process image" }, { status: 400 });
    }

    // Generate alt text in background after response is sent
    after(async () => {
      await generateAndSaveAltText(
        url,
        fileName || url.split("/").pop() || "",
        folderId || null,
        siteId,
        imageBase64
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Generate alt text error:", error);
    return NextResponse.json(
      { error: "Failed to trigger alt text generation" },
      { status: 500 }
    );
  }
}
