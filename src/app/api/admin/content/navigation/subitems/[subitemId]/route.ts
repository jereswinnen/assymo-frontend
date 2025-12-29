import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ subitemId: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subitemId } = await params;

    await sql`DELETE FROM navigation_subitems WHERE id = ${subitemId}`;

    // Invalidate navigation cache
    updateTag(CACHE_TAGS.navigation);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete navigation subitem:", error);
    return NextResponse.json(
      { error: "Failed to delete navigation subitem" },
      { status: 500 }
    );
  }
}
