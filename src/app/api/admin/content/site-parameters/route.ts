import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";
import type { SiteParameters } from "@/types/content";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "parameters" });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    const rows = await sql`
      SELECT * FROM site_parameters WHERE site_id = ${siteId}
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

export async function PUT(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "parameters" });
    if (!authorized) return response;

    const data = await request.json();
    const { siteId } = data;

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    await sql`
      INSERT INTO site_parameters (site_id, address, phone, email, instagram, facebook, vat_number, updated_at)
      VALUES (${siteId}, ${data.address || null}, ${data.phone || null}, ${data.email || null}, ${data.instagram || null}, ${data.facebook || null}, ${data.vat_number || null}, NOW())
      ON CONFLICT (site_id) DO UPDATE SET
        address = ${data.address || null},
        phone = ${data.phone || null},
        email = ${data.email || null},
        instagram = ${data.instagram || null},
        facebook = ${data.facebook || null},
        vat_number = ${data.vat_number || null},
        updated_at = NOW()
    `;

    // Invalidate site parameters cache
    revalidateTag(CACHE_TAGS.siteParameters, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update site parameters:", error);
    return NextResponse.json(
      { error: "Failed to update site parameters" },
      { status: 500 }
    );
  }
}
