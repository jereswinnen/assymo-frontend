import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-utils";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { neon } from "@neondatabase/serverless";
import { CHATBOT_CONFIG } from "@/config/chatbot";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, folderId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate folderId if provided
    const validFolderId = folderId && typeof folderId === "string" ? folderId : null;

    // Fetch the image and convert to base64
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
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

    // Save to database (include folder_id if provided)
    if (validFolderId) {
      await sql`
        INSERT INTO image_metadata (url, alt_text, folder_id)
        VALUES (${url}, ${altText}, ${validFolderId}::uuid)
        ON CONFLICT (url) DO UPDATE SET
          alt_text = ${altText},
          folder_id = COALESCE(image_metadata.folder_id, ${validFolderId}::uuid),
          updated_at = NOW()
      `;
    } else {
      await sql`
        INSERT INTO image_metadata (url, alt_text)
        VALUES (${url}, ${altText})
        ON CONFLICT (url) DO UPDATE SET
          alt_text = ${altText},
          updated_at = NOW()
      `;
    }

    return NextResponse.json({ altText });
  } catch (error) {
    console.error("Alt text generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate alt text" },
      { status: 500 }
    );
  }
}
