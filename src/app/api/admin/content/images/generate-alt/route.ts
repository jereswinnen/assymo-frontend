import { NextResponse, after } from "next/server";
import { isAuthenticated } from "@/lib/auth-utils";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { neon } from "@neondatabase/serverless";
import { CHATBOT_CONFIG } from "@/config/chatbot";

const sql = neon(process.env.DATABASE_URL!);

async function generateAndSaveAltText(
  imageUrl: string,
  fileName: string
): Promise<void> {
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
              image: imageUrl,
            },
          ],
        },
      ],
    });

    const altText = text.trim();

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
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, fileName } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Generate alt text in background after response is sent
    after(async () => {
      await generateAndSaveAltText(url, fileName || url.split("/").pop() || "");
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
