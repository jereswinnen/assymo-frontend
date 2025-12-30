import {
  type Feature,
  type FeatureOverrides,
  type Role,
  type PermissionContext,
  ROLE_FEATURES,
  ROLE_HIERARCHY,
  SITE_SCOPED_FEATURES,
} from "./types";

/**
 * Safely parse feature overrides from JSON string
 * Returns null if parsing fails or input is invalid
 */
export function parseFeatureOverrides(
  json: string | null | undefined
): FeatureOverrides | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    // Validate structure
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      grants: Array.isArray(parsed.grants) ? parsed.grants : undefined,
      revokes: Array.isArray(parsed.revokes) ? parsed.revokes : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate effective features for a user based on role and overrides
 * This is the single source of truth for feature calculation
 */
export function getEffectiveFeatures(
  role: Role,
  overrides: FeatureOverrides | null | undefined
): Feature[] {
  const roleFeatures = ROLE_FEATURES[role];
  if (!overrides) return roleFeatures;

  const grants = overrides.grants || [];
  const revokes = overrides.revokes || [];

  return [
    ...roleFeatures.filter((f) => !revokes.includes(f)),
    ...grants.filter((f) => !roleFeatures.includes(f)),
  ];
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  ctx: PermissionContext,
  feature: Feature
): boolean {
  const { user } = ctx;

  // Super admin always has access to everything
  if (user.role === "super_admin") {
    return true;
  }

  // Check if feature is explicitly revoked for this user
  if (user.featureOverrides?.revokes?.includes(feature)) {
    return false;
  }

  // Check if feature is explicitly granted for this user
  if (user.featureOverrides?.grants?.includes(feature)) {
    return true;
  }

  // Check role default permissions
  return ROLE_FEATURES[user.role].includes(feature);
}

/**
 * Check if user can access a specific site
 */
export function canAccessSite(
  ctx: PermissionContext,
  siteId: string
): boolean {
  // Super admin can access all sites
  if (ctx.user.role === "super_admin") {
    return true;
  }

  return ctx.userSites.includes(siteId);
}

/**
 * Get list of site IDs user can access, or "all" for super_admin
 */
export function getAccessibleSites(
  ctx: PermissionContext
): string[] | "all" {
  if (ctx.user.role === "super_admin") {
    return "all";
  }
  return ctx.userSites;
}

/**
 * Check if a feature is site-scoped (content) vs global (business)
 */
export function isSiteScopedFeature(feature: Feature): boolean {
  return SITE_SCOPED_FEATURES.includes(feature);
}

/**
 * Check if user has access to a feature for a specific site
 * Combines feature access + site access checks
 */
export function hasAccess(
  ctx: PermissionContext,
  feature: Feature,
  siteId?: string
): boolean {
  // First check feature access
  if (!hasFeatureAccess(ctx, feature)) {
    return false;
  }

  // For site-scoped features, also check site access
  if (siteId && isSiteScopedFeature(feature)) {
    return canAccessSite(ctx, siteId);
  }

  return true;
}

/**
 * Check if user is at least a certain role level
 */
export function hasRole(ctx: PermissionContext, role: Role): boolean {
  return ROLE_HIERARCHY[ctx.user.role] >= ROLE_HIERARCHY[role];
}

/**
 * Check if user is super_admin
 */
export function isSuperAdmin(ctx: PermissionContext): boolean {
  return ctx.user.role === "super_admin";
}

/**
 * Check if user is at least admin level
 */
export function isAdmin(ctx: PermissionContext): boolean {
  return ctx.user.role === "super_admin" || ctx.user.role === "admin";
}
