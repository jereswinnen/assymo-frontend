import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/admin/users
 * List all users with their roles and site assignments
 * Requires: super_admin
 */
export async function GET() {
  try {
    const { authorized, response } = await protectRoute({ feature: "users" });
    if (!authorized) return response;

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
      GROUP BY u.id
      ORDER BY u.name
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (via Better Auth admin API or direct DB)
 * Requires: super_admin
 *
 * Note: For now, this just updates an existing user's role.
 * Creating users requires Better Auth CLI: `npx better-auth user create`
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "users" });
    if (!authorized) return response;

    const body = await request.json();
    const { email, role, siteIds } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email en rol zijn verplicht" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM "user" WHERE email = ${email}
    `;

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden. Maak eerst een account aan via CLI." },
        { status: 404 }
      );
    }

    const userId = existingUser[0].id;

    // Update role
    await sql`
      UPDATE "user" SET role = ${role} WHERE id = ${userId}
    `;

    // Update site assignments
    if (siteIds && Array.isArray(siteIds)) {
      // Remove existing assignments
      await sql`DELETE FROM user_sites WHERE user_id = ${userId}`;

      // Add new assignments
      for (const siteId of siteIds) {
        await sql`
          INSERT INTO user_sites (user_id, site_id)
          VALUES (${userId}, ${siteId})
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
