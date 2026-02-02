import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { hasFeatureAccess, canAccessSite } from "./check";
import { getUserPermissionsWithSites } from "./queries";
import type { Feature, PermissionContext, Role, FeatureOverrides } from "./types";
import { DEFAULT_ROLE } from "./types";

// In-memory cache for user permissions with 5-minute TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedPermissions {
  role: Role;
  featureOverrides: FeatureOverrides | null;
  siteIds: string[];
  cachedAt: number;
}

const permissionsCache = new Map<string, CachedPermissions>();

function getCachedPermissions(userId: string): CachedPermissions | null {
  const cached = permissionsCache.get(userId);
  if (!cached) return null;

  // Check if cache has expired
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    permissionsCache.delete(userId);
    return null;
  }

  return cached;
}

function setCachedPermissions(
  userId: string,
  permissions: { role: Role; featureOverrides: FeatureOverrides | null; siteIds: string[] }
): void {
  permissionsCache.set(userId, {
    ...permissions,
    cachedAt: Date.now(),
  });
}

/**
 * Invalidate cached permissions for a user.
 * Call this when a user's role, feature overrides, or site assignments change.
 */
export function invalidatePermissionsCache(userId: string): void {
  permissionsCache.delete(userId);
}

/**
 * Clear all cached permissions.
 * Useful for testing or when doing bulk permission changes.
 */
export function clearPermissionsCache(): void {
  permissionsCache.clear();
}

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

  // Check cache first, then query if needed (single combined query)
  let cached = getCachedPermissions(user.id);

  if (!cached) {
    const permissions = await getUserPermissionsWithSites(user.id);
    if (permissions) {
      setCachedPermissions(user.id, permissions);
      cached = {
        ...permissions,
        cachedAt: Date.now(),
      };
    }
  }

  // Build permission context
  const ctx: PermissionContext = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: cached?.role || DEFAULT_ROLE,
      featureOverrides: cached?.featureOverrides || null,
    },
    userSites: cached?.siteIds || [],
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

  // Check cache first, then query if needed (single combined query)
  let cached = getCachedPermissions(user.id);

  if (!cached) {
    const permissions = await getUserPermissionsWithSites(user.id);
    if (permissions) {
      setCachedPermissions(user.id, permissions);
      cached = {
        ...permissions,
        cachedAt: Date.now(),
      };
    }
  }

  const ctx: PermissionContext = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: cached?.role || DEFAULT_ROLE,
      featureOverrides: cached?.featureOverrides || null,
    },
    userSites: cached?.siteIds || [],
  };

  return {
    authorized: true,
    ctx,
  };
}
