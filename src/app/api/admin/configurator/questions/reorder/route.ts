import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CONFIGURATOR_CACHE_TAGS } from "@/lib/configurator/queries";

const sql = neon(process.env.DATABASE_URL!);

export async function PUT(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { orderedIds, siteId } = await request.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "orderedIds array is required" },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json(
        { error: "Geen toegang tot deze site" },
        { status: 403 }
      );
    }

    // Update order_rank for each question
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE configurator_questions
        SET order_rank = ${i}, updated_at = now()
        WHERE id = ${orderedIds[i]}
          AND site_id = ${siteId}
      `;
    }

    // Invalidate cache
    revalidateTag(CONFIGURATOR_CACHE_TAGS.questions, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder questions:", error);
    return NextResponse.json(
      { error: "Failed to reorder questions" },
      { status: 500 }
    );
  }
}
