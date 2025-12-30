import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { getUserPermissions } from "@/lib/permissions/queries";
import { getEffectiveFeatures } from "@/lib/permissions/check";
import { DEFAULT_ROLE } from "@/lib/permissions/types";

/**
 * GET /api/admin/user-permissions
 *
 * Returns the current user's effective features (role + overrides combined)
 * Used by the sidebar to display correct navigation items
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get fresh permissions from database (not cached session)
    const permissions = await getUserPermissions(session.user.id);
    const role = permissions?.role || DEFAULT_ROLE;
    const effectiveFeatures = getEffectiveFeatures(
      role,
      permissions?.featureOverrides || null
    );

    return NextResponse.json({
      role,
      effectiveFeatures,
    });
  } catch (error) {
    console.error("Failed to fetch user permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
