import { protectRoute } from "@/lib/permissions";

const ALLOWED_MODELS = [
  "gpt-image-1-mini",
  "gpt-image-1",
  "gpt-image-1.5-2025-12-16",
] as const;

type AllowedModel = (typeof ALLOWED_MODELS)[number];

interface OpenAIResponseOutput {
  type: string;
  result?: string;
}

interface OpenAIResponseAPIResponse {
  output: OpenAIResponseOutput[];
}

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

    // Call OpenAI Responses API with image_generation tool
    // This allows editing images based on a prompt without requiring a mask
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: prompt },
                {
                  type: "input_image",
                  image_url: imageBase64,
                },
              ],
            },
          ],
          tools: [
            {
              type: "image_generation",
              image_generation: {
                model: model,
                size: "1024x1024",
              },
            },
          ],
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return Response.json(
        { error: "Failed to generate image" },
        { status: openaiResponse.status }
      );
    }

    const result = (await openaiResponse.json()) as OpenAIResponseAPIResponse;

    // Find the image generation result in the output
    const imageGenerationCall = result.output?.find(
      (output) => output.type === "image_generation_call"
    );

    if (!imageGenerationCall?.result) {
      console.error("No image generated in response:", result);
      return Response.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    // The result is base64 encoded image data (without the data URL prefix)
    const outputMimeType = "image/png";

    return Response.json({
      base64: `data:${outputMimeType};base64,${imageGenerationCall.result}`,
      mimeType: outputMimeType,
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
