import { NextRequest, NextResponse } from "next/server";
import { protectRoute } from "@/lib/permissions";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { CHATBOT_CONFIG } from "@/config/chatbot";

export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { title, content } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Generate meta description
    const { text } = await generateText({
      model: openai(CHATBOT_CONFIG.model),
      messages: [
        {
          role: "user",
          content: `Genereer een meta description voor een webpagina in het Nederlands.

Titel: ${title}
${content ? `Inhoud: ${content}` : ""}

STRIKTE VEREISTEN:
- MAXIMUM 150 tekens (dit is cruciaal - langere teksten worden afgeknipt in Google)
- Wervend en informatief
- Bevat een call-to-action indien passend
- Geef ALLEEN de meta description terug, geen aanhalingstekens of andere tekst`,
        },
      ],
    });

    const metaDescription = text.trim();

    return NextResponse.json({ metaDescription });
  } catch (error) {
    console.error("Meta description generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate meta description" },
      { status: 500 }
    );
  }
}
