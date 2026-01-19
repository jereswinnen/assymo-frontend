import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import type { Feature, Role, FeatureOverrides } from "@/lib/permissions/types";
import { ROLE_FEATURES } from "@/lib/permissions/types";

/**
 * Route to required feature mapping for API routes.
 * Routes not listed here will be blocked by default (fail-secure).
 * Use `null` for routes that only require authentication (no specific feature).
 */
const ROUTE_FEATURES: Record<string, Feature | null> = {
  // Appointments
  "/api/admin/appointments": "appointments",

  // Emails / Newsletters
  "/api/admin/newsletters": "emails",
  "/api/admin/contacts": "emails",
  "/api/admin/email-preview": "emails",

  // Conversations
  "/api/admin/conversations": "conversations",

  // Users
  "/api/admin/users": "users",

  // Sites
  "/api/admin/sites": "sites",

  // Content - Pages
  "/api/admin/content/pages": "pages",

  // Content - Solutions
  "/api/admin/content/solutions": "solutions",

  // Content - Media
  "/api/admin/content/media": "media",
  "/api/admin/content/images": "media",

  // Content - Navigation
  "/api/admin/content/navigation": "navigation",

  // Content - Filters
  "/api/admin/content/filters": "filters",
  "/api/admin/content/filter-categories": "filters",

  // Content - Parameters
  "/api/admin/content/site-parameters": "parameters",

  // Settings / RAG
  "/api/admin/document-info": "settings",
  "/api/admin/document-upload": "settings",
  "/api/admin/test-retrieval": "settings",
  "/api/admin/content/generate-meta-description": "settings",

  // Auth-related (no specific feature, just needs login)
  "/api/admin/user": null,
  "/api/admin/user-permissions": null,
  "/api/admin/user-sites": null,
};

/**
 * Get the required feature for a route path.
 * Matches the longest prefix first.
 */
function getRequiredFeature(pathname: string): Feature | null | undefined {
  // Sort by length descending to match most specific route first
  const sortedRoutes = Object.keys(ROUTE_FEATURES).sort(
    (a, b) => b.length - a.length
  );

  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return ROUTE_FEATURES[route];
    }
  }

  // Route not in mapping - return undefined (will be blocked)
  return undefined;
}

/**
 * Compute effective features based on role and overrides.
 */
function getEffectiveFeatures(
  role: Role,
  overrides: FeatureOverrides | null
): Feature[] {
  const baseFeatures = ROLE_FEATURES[role] || [];
  if (!overrides) return baseFeatures;

  const features = new Set(baseFeatures);

  // Apply grants
  if (overrides.grants) {
    for (const feature of overrides.grants) {
      features.add(feature);
    }
  }

  // Apply revokes
  if (overrides.revokes) {
    for (const feature of overrides.revokes) {
      features.delete(feature);
    }
  }

  return Array.from(features);
}

/**
 * Get session token from request cookies
 */
function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value
  );
}

/**
 * Protect admin page routes (redirect to login if not authenticated)
 */
function handleAdminPageRoute(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Skip auth pages
  if (pathname.startsWith("/admin/auth")) {
    return null;
  }

  // Check for session cookie
  const sessionToken = getSessionToken(request);

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/admin/auth", request.url));
  }

  return null;
}

/**
 * Protect admin API routes (return 401/403 if not authenticated/authorized)
 */
async function handleAdminApiRoute(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Get session token
  const sessionToken = getSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get required feature for this route
  const requiredFeature = getRequiredFeature(pathname);

  // Route not in mapping = blocked (fail-secure)
  if (requiredFeature === undefined) {
    console.warn(`[middleware] Unregistered admin route accessed: ${pathname}`);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Query database for session and user permissions
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Get session and user in one query
    const result = await sql`
      SELECT
        s.id as session_id,
        s."expiresAt" as expires_at,
        u.id as user_id,
        u.role,
        u."featureOverrides" as feature_overrides
      FROM session s
      JOIN "user" u ON s."userId" = u.id
      WHERE s.token = ${sessionToken}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = result[0];

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If route only requires auth (null), allow through
    if (requiredFeature === null) {
      return null;
    }

    // Check feature access
    const role = (session.role as Role) || "user";
    const overrides = session.feature_overrides as FeatureOverrides | null;
    const effectiveFeatures = getEffectiveFeatures(role, overrides);

    if (!effectiveFeatures.includes(requiredFeature)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Authorized - continue to route handler
    return null;
  } catch (error) {
    console.error("[middleware] Permission check failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin API routes
  if (pathname.startsWith("/api/admin")) {
    const response = await handleAdminApiRoute(request);
    return response ?? NextResponse.next();
  }

  // Handle admin page routes
  if (pathname.startsWith("/admin")) {
    const response = handleAdminPageRoute(request);
    return response ?? NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
