import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { hasFeatureAccess, canAccessSite } from "./check";
import { getUserSiteIds, getUserPermissions } from "./queries";
import type { Feature, PermissionContext } from "./types";
import { DEFAULT_ROLE } from "./types";

export interface ProtectRouteOptions {
  /** Required feature to access this route */
  feature: Feature;
  /** If provided, also check site access (for site-scoped features) */
  siteId?: string;
}

export interface ProtectRouteResult {
  /** Whether the request is authorized */
  authorized: boolean;
  /** Response to return if not authorized (401 or 403) */
  response?: NextResponse;
  /** Permission context if authorized (for use in handler) */
  ctx?: PermissionContext;
}

/**
 * Protect an API route with authentication and permission checks.
 *
 * Usage:
 * ```ts
 * export async function GET() {
 *   const { authorized, response, ctx } = await protectRoute({
 *     feature: "appointments",
 *   });
 *   if (!authorized) return response;
 *
 *   // ctx is available for further permission checks
 *   // ... rest of handler
 * }
 * ```
 */
export async function protectRoute(
  options: ProtectRouteOptions
): Promise<ProtectRouteResult> {
  // Check authentication
  const session = await getSession();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const user = session.user;

  // Query fresh permissions from database (not cached session)
  const [userSites, permissions] = await Promise.all([
    getUserSiteIds(user.id),
    getUserPermissions(user.id),
  ]);

  // Build permission context with fresh data from DB
  const ctx: PermissionContext = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: permissions?.role || DEFAULT_ROLE,
      featureOverrides: permissions?.featureOverrides || null,
    },
    userSites,
  };

  // Check feature access
  if (!hasFeatureAccess(ctx, options.feature)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  // Check site access if site-scoped
  if (options.siteId && !canAccessSite(ctx, options.siteId)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    ctx,
  };
}

/**
 * Simple authentication check (no permission check).
 * Use when you only need to verify the user is logged in.
 */
export async function requireAuth(): Promise<{
  authorized: boolean;
  response?: NextResponse;
  ctx?: PermissionContext;
}> {
  const session = await getSession();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const user = session.user;

  // Query fresh permissions from database
  const [userSites, permissions] = await Promise.all([
    getUserSiteIds(user.id),
    getUserPermissions(user.id),
  ]);

  const ctx: PermissionContext = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: permissions?.role || DEFAULT_ROLE,
      featureOverrides: permissions?.featureOverrides || null,
    },
    userSites,
  };

  return {
    authorized: true,
    ctx,
  };
}
