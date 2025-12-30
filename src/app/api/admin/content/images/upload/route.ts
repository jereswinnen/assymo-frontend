import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { protectRoute } from "@/lib/permissions";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  const { authorized, response } = await protectRoute({ feature: "media" });
  if (!authorized) return response;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file extension
        const extension = pathname.split(".").pop()?.toLowerCase();
        const allowedExtensions = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "avif",
        ];

        if (!extension || !allowedExtensions.includes(extension)) {
          throw new Error("File type not allowed");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/avif",
          ],
          maximumSizeInBytes: MAX_FILE_SIZE,
        };
      },
      onUploadCompleted: async () => {
        // Upload completed - alt text generation is triggered separately
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
