// Type exports
export type {
  Role,
  Feature,
  FeatureOverrides,
  Site,
  UserWithPermissions,
  PermissionContext,
} from "./types";

// Constants
export {
  ROLES,
  FEATURES,
  DEFAULT_ROLE,
  ROLE_HIERARCHY,
  ROLE_FEATURES,
  SITE_SCOPED_FEATURES,
  GLOBAL_FEATURES,
} from "./types";

// Permission checking functions
export {
  parseFeatureOverrides,
  getEffectiveFeatures,
  hasFeatureAccess,
  canAccessSite,
  getAccessibleSites,
  isSiteScopedFeature,
  hasAccess,
  hasRole,
  isSuperAdmin,
  isAdmin,
} from "./check";

// Database queries
export {
  getUserSiteIds,
  getUserSites,
  getAllSites,
  getSiteById,
  getSiteBySlug,
  getUserPermissions,
  assignUserToSite,
  removeUserFromSite,
  updateUserRole,
  updateUserFeatureOverrides,
} from "./queries";

// Route protection middleware
export { protectRoute, requireAuth } from "./middleware";
export type { ProtectRouteOptions, ProtectRouteResult } from "./middleware";
