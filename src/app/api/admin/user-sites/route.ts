import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { getUserSites, getAllSites } from "@/lib/permissions/queries";
import { isSuperAdmin } from "@/lib/permissions/check";
import type { Role } from "@/lib/permissions/types";

/**
 * GET /api/admin/user-sites
 * Get the sites the current user has access to
 * Super admins get all sites, others get their assigned sites
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const role = (user.role as Role) || "content_editor";

    // Super admins get all sites
    if (
      isSuperAdmin({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
          featureOverrides: null,
        },
        userSites: [],
      })
    ) {
      const sites = await getAllSites();
      return NextResponse.json({ sites });
    }

    // Others get their assigned sites
    const sites = await getUserSites(user.id);
    return NextResponse.json({ sites });
  } catch (error) {
    console.error("Error fetching user sites:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
