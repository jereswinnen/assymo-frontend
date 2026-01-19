import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";
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

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM "user" WHERE id = ${id}
    `;

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Update role if provided
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
      const currentUser = await sql`SELECT role FROM "user" WHERE id = ${id}`;
      if (currentUser[0]?.role === "super_admin" && role !== "super_admin") {
        const superAdminCount = await sql`
          SELECT COUNT(*) as count FROM "user" WHERE role = 'super_admin'
        `;
        if (parseInt(superAdminCount[0].count) <= 1) {
          return NextResponse.json(
            { error: "Er moet minimaal één super admin zijn" },
            { status: 400 }
          );
        }
      }

      await sql`UPDATE "user" SET role = ${role} WHERE id = ${id}`;
    }

    // Update feature overrides if provided
    if (featureOverrides !== undefined) {
      const overridesJson = featureOverrides
        ? JSON.stringify(featureOverrides as FeatureOverrides)
        : null;
      await sql`UPDATE "user" SET feature_overrides = ${overridesJson} WHERE id = ${id}`;
    }

    // Update site assignments if provided
    if (siteIds !== undefined && Array.isArray(siteIds)) {
      // Remove existing assignments
      await sql`DELETE FROM user_sites WHERE user_id = ${id}`;

      // Add new assignments
      for (const siteId of siteIds) {
        await sql`
          INSERT INTO user_sites (user_id, site_id)
          VALUES (${id}, ${siteId})
        `;
      }
    }

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

    // Check if user exists
    const existingUser = await sql`
      SELECT id, role FROM "user" WHERE id = ${id}
    `;

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Prevent deleting the last super_admin
    if (existingUser[0].role === "super_admin") {
      const superAdminCount = await sql`
        SELECT COUNT(*) as count FROM "user" WHERE role = 'super_admin'
      `;
      if (parseInt(superAdminCount[0].count) <= 1) {
        return NextResponse.json(
          { error: "Er moet minimaal één super admin zijn" },
          { status: 400 }
        );
      }
    }

    // Delete in order: sessions, accounts, site assignments, then user
    await sql`DELETE FROM "session" WHERE "userId" = ${id}`;
    await sql`DELETE FROM "account" WHERE "userId" = ${id}`;
    await sql`DELETE FROM user_sites WHERE user_id = ${id}`;
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
