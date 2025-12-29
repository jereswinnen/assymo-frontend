import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";
import type { SiteParameters } from "@/types/content";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT * FROM site_parameters WHERE id = 1
    `;

    // Return empty object with defaults if no row exists
    const params: Partial<SiteParameters> = rows[0] || {
      address: "",
      phone: "",
      email: "",
      instagram: "",
      facebook: "",
      vat_number: "",
    };

    return NextResponse.json(params);
  } catch (error) {
    console.error("Failed to fetch site parameters:", error);
    return NextResponse.json(
      { error: "Failed to fetch site parameters" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    await sql`
      INSERT INTO site_parameters (id, address, phone, email, instagram, facebook, vat_number, updated_at)
      VALUES (1, ${data.address || null}, ${data.phone || null}, ${data.email || null}, ${data.instagram || null}, ${data.facebook || null}, ${data.vat_number || null}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        address = ${data.address || null},
        phone = ${data.phone || null},
        email = ${data.email || null},
        instagram = ${data.instagram || null},
        facebook = ${data.facebook || null},
        vat_number = ${data.vat_number || null},
        updated_at = NOW()
    `;

    // Invalidate site parameters cache
    updateTag(CACHE_TAGS.siteParameters);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update site parameters:", error);
    return NextResponse.json(
      { error: "Failed to update site parameters" },
      { status: 500 }
    );
  }
}
