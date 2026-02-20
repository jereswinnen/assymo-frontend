import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";
import type { SiteParameters } from "@/types/content";

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

    // Check if row exists for this site
    const existing = await sql`
      SELECT id FROM site_parameters WHERE site_id = ${siteId}
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE site_parameters SET
          address = ${data.address || null},
          phone = ${data.phone || null},
          email = ${data.email || null},
          instagram = ${data.instagram || null},
          facebook = ${data.facebook || null},
          vat_number = ${data.vat_number || null},
          updated_at = NOW()
        WHERE site_id = ${siteId}
      `;
    } else {
      // Get next id manually since column has bad default
      const maxId = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM site_parameters`;
      await sql`
        INSERT INTO site_parameters (id, site_id, address, phone, email, instagram, facebook, vat_number, updated_at)
        VALUES (${maxId[0].next_id}, ${siteId}, ${data.address || null}, ${data.phone || null}, ${data.email || null}, ${data.instagram || null}, ${data.facebook || null}, ${data.vat_number || null}, NOW())
      `;
    }

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
