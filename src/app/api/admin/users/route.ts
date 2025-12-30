import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { PasswordReset } from "@/emails/PasswordReset";
import crypto from "crypto";

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
 * Create a new user and send password reset email
 * Requires: super_admin
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "users" });
    if (!authorized) return response;

    const body = await request.json();
    const { name, email, role, siteIds } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Naam, email en rol zijn verplicht" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ongeldig email adres" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM "user" WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Er bestaat al een gebruiker met dit email adres" },
        { status: 400 }
      );
    }

    // Generate a random password (user will reset it via email)
    const tempPassword = crypto.randomBytes(32).toString("hex");

    // Create user via Better Auth's internal context
    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(tempPassword);
    const userId = crypto.randomUUID();
    const now = new Date();

    // Insert user into database
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email}, true, ${role}, ${now.toISOString()}, ${now.toISOString()})
    `;

    // Insert account (password credential)
    await sql`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${userId}, ${userId}, 'credential', ${hashedPassword}, ${now.toISOString()}, ${now.toISOString()})
    `;

    // Assign sites if provided
    if (siteIds && Array.isArray(siteIds) && siteIds.length > 0) {
      for (const siteId of siteIds) {
        await sql`
          INSERT INTO user_sites (user_id, site_id)
          VALUES (${userId}, ${siteId})
        `;
      }
    }

    // Create password reset token and send email
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store verification token
    await sql`
      INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${email}, ${token}, ${expiresAt.toISOString()}, ${now.toISOString()}, ${now.toISOString()})
    `;

    // Build reset URL and send email
    const resetUrl = `${baseUrl}/admin/auth/reset-password?token=${token}`;
    await resend.emails.send({
      from: RESEND_CONFIG.fromAddressAuth,
      to: email,
      subject: RESEND_CONFIG.subjects.passwordReset,
      react: PasswordReset({ resetUrl }),
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de gebruiker" },
      { status: 500 }
    );
  }
}
