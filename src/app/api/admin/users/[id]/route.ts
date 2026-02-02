import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute, invalidatePermissionsCache } from "@/lib/permissions";
import type { Role, FeatureOverrides } from "@/lib/permissions/types";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/[id]
 * Get a single user with their sites and permissions
 * Requires: super_admin
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response } = await protectRoute({ feature: "users" });
    if (!authorized) return response;

    const { id } = await params;

    const users = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.feature_overrides,
        u."createdAt" as created_at,
        u."twoFactorEnabled" as two_factor_enabled,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name, 'slug', s.slug)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as sites
      FROM "user" u
      LEFT JOIN user_sites us ON u.id = us.user_id
      LEFT JOIN sites s ON us.site_id = s.id
      WHERE u.id = ${id}
      GROUP BY u.id
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user's role, feature overrides, and site assignments
 * Requires: super_admin
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "users" });
    if (!authorized) return response;

    const { id } = await params;
    const body = await request.json();
    const { role, featureOverrides, siteIds } = body;

    // Combined query: check existence, get current role, and count super_admins in one round-trip
    const validation = await sql`
      SELECT
        u.role as current_role,
        (SELECT COUNT(*) FROM "user" WHERE role = 'super_admin') as super_admin_count
      FROM "user" u
      WHERE u.id = ${id}
    `;

    if (validation.length === 0) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    const { current_role: currentRole, super_admin_count: superAdminCount } = validation[0];

    // Validate and prepare role update if provided
    if (role) {
      const validRoles: Role[] = ["super_admin", "admin", "content_editor", "user"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Ongeldige rol" },
          { status: 400 }
        );
      }

      // Prevent changing your own role
      if (ctx?.user.id === id) {
        return NextResponse.json(
          { error: "Je kunt je eigen rol niet wijzigen" },
          { status: 400 }
        );
      }

      // Check if this would remove the last super_admin
      if (currentRole === "super_admin" && role !== "super_admin") {
        if (parseInt(superAdminCount) <= 1) {
          return NextResponse.json(
            { error: "Er moet minimaal één super admin zijn" },
            { status: 400 }
          );
        }
      }
    }

    // Combined update for role and feature_overrides in single query
    const hasRoleUpdate = role !== undefined;
    const hasOverridesUpdate = featureOverrides !== undefined;

    if (hasRoleUpdate || hasOverridesUpdate) {
      const overridesJson = hasOverridesUpdate
        ? (featureOverrides ? JSON.stringify(featureOverrides as FeatureOverrides) : null)
        : undefined;

      if (hasRoleUpdate && hasOverridesUpdate) {
        await sql`UPDATE "user" SET role = ${role}, feature_overrides = ${overridesJson} WHERE id = ${id}`;
      } else if (hasRoleUpdate) {
        await sql`UPDATE "user" SET role = ${role} WHERE id = ${id}`;
      } else if (hasOverridesUpdate) {
        await sql`UPDATE "user" SET feature_overrides = ${overridesJson} WHERE id = ${id}`;
      }
    }

    // Update site assignments if provided - batch insert for efficiency
    if (siteIds !== undefined && Array.isArray(siteIds)) {
      // Remove existing assignments
      await sql`DELETE FROM user_sites WHERE user_id = ${id}`;

      // Add new assignments in single query
      if (siteIds.length > 0) {
        await sql`
          INSERT INTO user_sites (user_id, site_id)
          SELECT ${id}, unnest(${siteIds}::uuid[])
        `;
      }
    }

    // Invalidate permission cache since user's permissions may have changed
    invalidatePermissionsCache(id);

    // Fetch updated user
    const updatedUser = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.feature_overrides,
        u."createdAt" as created_at,
        u."twoFactorEnabled" as two_factor_enabled,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name, 'slug', s.slug)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as sites
      FROM "user" u
      LEFT JOIN user_sites us ON u.id = us.user_id
      LEFT JOIN sites s ON us.site_id = s.id
      WHERE u.id = ${id}
      GROUP BY u.id
    `;

    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Permanently delete a user and all associated data
 * Requires: super_admin
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "users" });
    if (!authorized) return response;

    const { id } = await params;

    // Prevent self-deletion
    if (ctx?.user.id === id) {
      return NextResponse.json(
        { error: "Je kunt jezelf niet verwijderen" },
        { status: 400 }
      );
    }

    // Combined query: check existence, get role, and count super_admins in one round-trip
    const validation = await sql`
      SELECT
        u.role,
        (SELECT COUNT(*) FROM "user" WHERE role = 'super_admin') as super_admin_count
      FROM "user" u
      WHERE u.id = ${id}
    `;

    if (validation.length === 0) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Prevent deleting the last super_admin
    const { role, super_admin_count: superAdminCount } = validation[0];
    if (role === "super_admin" && parseInt(superAdminCount) <= 1) {
      return NextResponse.json(
        { error: "Er moet minimaal één super admin zijn" },
        { status: 400 }
      );
    }

    // Invalidate permission cache for the deleted user
    invalidatePermissionsCache(id);

    // Delete all user data - sessions and accounts have foreign key constraints
    // so we need to delete them first, but we can do site assignments in parallel
    await Promise.all([
      sql`DELETE FROM "session" WHERE "userId" = ${id}`,
      sql`DELETE FROM "account" WHERE "userId" = ${id}`,
      sql`DELETE FROM user_sites WHERE user_id = ${id}`,
    ]);
    await sql`DELETE FROM "user" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
