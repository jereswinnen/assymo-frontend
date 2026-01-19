/**
 * Role and permission type definitions for multi-user system
 */

// Available roles in order of hierarchy (highest to lowest)
export const ROLES = {
  super_admin: "super_admin",
  admin: "admin",
  content_editor: "content_editor",
  user: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Default role for users without an explicit role
export const DEFAULT_ROLE: Role = "content_editor";

// Role hierarchy for permission comparisons
export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  admin: 50,
  content_editor: 10,
  user: 1,
};

// All available features in the admin
export const FEATURES = {
  // Content features (site-scoped)
  pages: "pages",
  solutions: "solutions",
  navigation: "navigation",
  filters: "filters",
  media: "media",
  parameters: "parameters",

  // Business features (global)
  appointments: "appointments",
  emails: "emails",
  conversations: "conversations",
  settings: "settings",

  // Admin features (super_admin only)
  users: "users",
  sites: "sites",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

// Features that are scoped to specific sites
export const SITE_SCOPED_FEATURES: Feature[] = [
  "pages",
  "solutions",
  "navigation",
  "filters",
  "media",
  "parameters",
];

// Features that are global (not site-specific)
export const GLOBAL_FEATURES: Feature[] = [
  "appointments",
  "emails",
  "conversations",
  "settings",
  "users",
  "sites",
];

// Default features for each role
export const ROLE_FEATURES: Record<Role, Feature[]> = {
  super_admin: Object.values(FEATURES),

  admin: [
    // Content features
    "pages",
    "solutions",
    "navigation",
    "filters",
    "media",
    "parameters",
    // Business features
    "appointments",
    "emails",
    "conversations",
    "settings",
  ],

  content_editor: [
    // Content features only
    "pages",
    "solutions",
    "navigation",
    "filters",
    "media",
    "parameters",
  ],

  // User role has no default features - all access must be explicitly granted
  user: [],
};

// Structure for per-user feature overrides
export interface FeatureOverrides {
  grants?: Feature[]; // Features granted beyond role defaults
  revokes?: Feature[]; // Features revoked from role defaults
}

// Site type
export interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  isActive: boolean;
  capabilities: Feature[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper type for site capabilities - features a site supports
export type SiteCapabilities = Feature[];

// User with permissions
export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: Role;
  featureOverrides: FeatureOverrides | null;
}

// Permission context for checking access
export interface PermissionContext {
  user: UserWithPermissions;
  userSites: string[]; // Site IDs the user has access to
}
