import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-utils";
import { deleteImage } from "@/lib/storage";

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

    await deleteImage(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image deletion failed:", error);
    return NextResponse.json(
      { error: "Deletion failed" },
      { status: 500 }
    );
  }
}
