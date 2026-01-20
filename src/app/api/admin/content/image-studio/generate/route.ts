import { generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { protectRoute } from "@/lib/permissions";

const ALLOWED_MODELS = [
  "gpt-image-1-mini",
  "gpt-image-1",
  "gpt-image-1.5-2025-12-16",
] as const;

type AllowedModel = (typeof ALLOWED_MODELS)[number];

export async function POST(request: Request) {
  // Check authentication and media permission
  const { authorized, response } = await protectRoute({ feature: "media" });
  if (!authorized) return response;

  try {
    const { prompt, imageBase64, model } = await request.json();

    // Validate inputs
    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json({ error: "Image is required" }, { status: 400 });
    }

    if (!ALLOWED_MODELS.includes(model as AllowedModel)) {
      return Response.json({ error: "Invalid model" }, { status: 400 });
    }

    // Validate the data URL format
    // Format: "data:image/png;base64,iVBORw0KGgo..."
    if (!imageBase64.startsWith("data:image/")) {
      return Response.json({ error: "Invalid image format" }, { status: 400 });
    }

    // Extract the base64 data from the data URL
    const base64Data = imageBase64.split(",")[1];
    if (!base64Data) {
      return Response.json({ error: "Invalid image format" }, { status: 400 });
    }

    // Convert base64 to Buffer for the AI SDK
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Call OpenAI image generation with input image for editing
    const { images } = await generateImage({
      model: openai.image(model),
      prompt: {
        text: prompt,
        images: [imageBuffer],
      },
      size: "1024x1024",
    });

    // Get the first generated image
    const generatedImage = images[0];
    if (!generatedImage) {
      return Response.json({ error: "No image generated" }, { status: 500 });
    }

    // Return the image as a data URL
    const mediaType = generatedImage.mediaType || "image/png";

    return Response.json({
      base64: `data:${mediaType};base64,${generatedImage.base64}`,
      mimeType: mediaType,
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
