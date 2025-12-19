import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-utils";
import { uploadImage } from "@/lib/storage";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { neon } from "@neondatabase/serverless";
import { CHATBOT_CONFIG } from "@/config/chatbot";
import { after } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

async function generateAndSaveAltText(
  imageBase64: string,
  mimeType: string,
  imageUrl: string,
  fileName: string
): Promise<void> {
  try {
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

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

    // Save to database
    await sql`
      INSERT INTO image_metadata (url, alt_text, display_name)
      VALUES (${imageUrl}, ${altText}, ${fileName})
      ON CONFLICT (url) DO UPDATE SET
        alt_text = ${altText},
        display_name = ${fileName},
        updated_at = NOW()
    `;

    console.log("Alt text generated:", altText);
  } catch (error) {
    console.error("Alt text generation failed:", error);
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Convert file to base64 before upload (need it for background alt text generation)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;
    const fileName = file.name;

    // Upload to Vercel Blob
    const result = await uploadImage(file);

    // Generate alt text in background after response is sent
    after(async () => {
      await generateAndSaveAltText(base64, mimeType, result.url, fileName);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
