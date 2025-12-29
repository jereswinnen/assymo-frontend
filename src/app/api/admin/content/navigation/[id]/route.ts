import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, slug, submenu_heading } = await request.json();

    const rows = await sql`
      UPDATE navigation_links
      SET title = ${title}, slug = ${slug}, submenu_heading = ${submenu_heading || null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Navigation link not found" },
        { status: 404 }
      );
    }

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update navigation link:", error);
    return NextResponse.json(
      { error: "Failed to update navigation link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await sql`DELETE FROM navigation_links WHERE id = ${id}`;

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete navigation link:", error);
    return NextResponse.json(
      { error: "Failed to delete navigation link" },
      { status: 500 }
    );
  }
}
