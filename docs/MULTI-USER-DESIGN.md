# Multi-User Roles and Permissions System Design

## 1. Executive Summary

This document outlines a multi-tenant, role-based access control (RBAC) system for the Assymo admin CMS. The system introduces:

- **Multi-site support**: Content is scoped to sites via a `site_id` column
- **Role-based access**: Predefined roles (super_admin, admin, content_editor) with hierarchical permissions
- **Per-user feature overrides**: Fine-grained control to grant/revoke specific features beyond role defaults
- **Seamless Better Auth integration**: Extends existing user model with custom fields for role and permissions

**Initial Users:**
| User | Role | Sites | Feature Restrictions |
|------|------|-------|---------------------|
| Jeremy | super_admin | All sites | None |
| Bart | admin | Assymo (main) | None |
| Willem | content_editor | VPG | Content features only |

---

## 2. Data Model

### 2.1 Schema Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│       sites         │     │   user (Better Auth)│
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ name                │     │ name                │
│ slug                │     │ email               │
│ domain              │     │ role                │◄── Added field
│ is_active           │     │ feature_overrides   │◄── Added field
│ created_at          │     │ mfaChoiceCompleted  │
│ updated_at          │     │ ...                 │
└─────────────────────┘     └─────────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────────┐
│                  user_sites                      │
├─────────────────────────────────────────────────┤
│ user_id (FK → user.id)                          │
│ site_id (FK → sites.id)                         │
│ PRIMARY KEY (user_id, site_id)                  │
└─────────────────────────────────────────────────┘
```

### 2.2 New Tables

#### `sites` Table
```sql
CREATE TABLE sites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial sites
INSERT INTO sites (name, slug, domain) VALUES
  ('Assymo', 'assymo', 'assymo.be'),
  ('VPG', 'vpg', 'vpg.be');
```

#### `user_sites` Junction Table
```sql
CREATE TABLE user_sites (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, site_id)
);

CREATE INDEX user_sites_user_idx ON user_sites(user_id);
CREATE INDEX user_sites_site_idx ON user_sites(site_id);
```

### 2.3 Better Auth User Extensions

Extend the existing Better Auth user table with additional fields:

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  // ... existing config
  user: {
    additionalFields: {
      mfaChoiceCompleted: {
        type: "boolean",
        defaultValue: false,
      },
      // NEW FIELDS
      role: {
        type: "string",
        defaultValue: "content_editor",
        input: false, // Cannot be set during signup (admin only)
      },
      featureOverrides: {
        type: "json",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
});
```

**Feature Overrides Schema:**
```typescript
interface FeatureOverrides {
  // Grant features beyond role (true = granted)
  grants?: string[];
  // Revoke features from role (true = revoked)
  revokes?: string[];
}

// Example: Admin with appointments disabled
{
  revokes: ["appointments"]
}

// Example: Content editor with media access disabled
{
  revokes: ["media"]
}
```

### 2.4 Content Tables: Add `site_id`

The following tables require a `site_id` column for multi-site content scoping:

| Table | Migration Required |
|-------|-------------------|
| `pages` | Add `site_id TEXT REFERENCES sites(id)` |
| `solutions` | Add `site_id TEXT REFERENCES sites(id)` |
| `filters` | Add `site_id TEXT REFERENCES sites(id)` |
| `filter_categories` | Add `site_id TEXT REFERENCES sites(id)` |
| `navigation_links` | Add `site_id TEXT REFERENCES sites(id)` |
| `navigation_subitems` | No change (inherits from parent) |
| `image_metadata` | Add `site_id TEXT REFERENCES sites(id)` |
| `site_parameters` | Rename to `site_settings`, add `site_id` (one per site) |

**Tables that remain global (no site_id):**
- `appointments` - Global business feature
- `appointment_opening_hours` - Global business feature
- `appointment_date_overrides` - Global business feature
- `newsletters` - Global business feature
- `chat_conversations` - Global feature
- `document_chunks` / `document_metadata` - RAG system (global)

### 2.5 Migration SQL

```sql
-- Phase 1: Create sites infrastructure
CREATE TABLE sites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_sites (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, site_id)
);

-- Add columns to user table (Better Auth will handle this via CLI)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'content_editor';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS feature_overrides JSONB;

-- Phase 5: Add site_id to content tables
ALTER TABLE pages ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE solutions ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE filters ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE filter_categories ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE navigation_links ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE image_metadata ADD COLUMN site_id TEXT REFERENCES sites(id);

-- Create indexes for site_id columns
CREATE INDEX pages_site_idx ON pages(site_id);
CREATE INDEX solutions_site_idx ON solutions(site_id);
CREATE INDEX filters_site_idx ON filters(site_id);
CREATE INDEX filter_categories_site_idx ON filter_categories(site_id);
CREATE INDEX navigation_links_site_idx ON navigation_links(site_id);
CREATE INDEX image_metadata_site_idx ON image_metadata(site_id);
```

---

## 3. Permission System Design

### 3.1 Role Definitions

```typescript
// src/lib/permissions/roles.ts

export const ROLES = {
  super_admin: "super_admin",
  admin: "admin",
  content_editor: "content_editor",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  admin: 50,
  content_editor: 10,
};
```

### 3.2 Feature Definitions

```typescript
// src/lib/permissions/features.ts

export const FEATURES = {
  // Content features (site-scoped)
  pages: "pages",
  solutions: "solutions",
  navigation: "navigation",
  filters: "filters",
  media: "media",
  parameters: "parameters",

  // Global features (not site-scoped)
  appointments: "appointments",
  emails: "emails",
  conversations: "conversations",
  settings: "settings",

  // Admin features
  users: "users",
  sites: "sites",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

// Features that are scoped to sites
export const SITE_SCOPED_FEATURES: Feature[] = [
  "pages",
  "solutions",
  "navigation",
  "filters",
  "media",
  "parameters",
];

// Features that are global
export const GLOBAL_FEATURES: Feature[] = [
  "appointments",
  "emails",
  "conversations",
  "settings",
  "users",
  "sites",
];
```

### 3.3 Permission Matrix

| Feature | super_admin | admin | content_editor |
|---------|-------------|-------|----------------|
| **Content (site-scoped)** |
| pages | Full | Full (assigned sites) | Full (assigned sites) |
| solutions | Full | Full (assigned sites) | Full (assigned sites) |
| navigation | Full | Full (assigned sites) | Full (assigned sites) |
| filters | Full | Full (assigned sites) | Full (assigned sites) |
| media | Full | Full (assigned sites) | Full (assigned sites) |
| parameters | Full | Full (assigned sites) | Full (assigned sites) |
| **Global features** |
| appointments | Full | Full | None |
| emails | Full | Full | None |
| conversations | Full | Full | None |
| settings | Full | Full | None |
| **Admin features** |
| users | Full | None | None |
| sites | Full | None | None |

### 3.4 Permission Resolution Logic

```typescript
// src/lib/permissions/check.ts

interface PermissionContext {
  user: {
    id: string;
    role: Role;
    featureOverrides?: FeatureOverrides;
  };
  userSites: string[]; // site IDs user has access to
}

export function hasFeatureAccess(
  ctx: PermissionContext,
  feature: Feature
): boolean {
  const { user } = ctx;

  // Super admin always has access
  if (user.role === "super_admin") {
    return true;
  }

  // Check if feature is explicitly revoked
  if (user.featureOverrides?.revokes?.includes(feature)) {
    return false;
  }

  // Check if feature is explicitly granted
  if (user.featureOverrides?.grants?.includes(feature)) {
    return true;
  }

  // Check role default permissions
  return ROLE_FEATURES[user.role].includes(feature);
}

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

export function getAccessibleSites(ctx: PermissionContext): string[] | "all" {
  if (ctx.user.role === "super_admin") {
    return "all";
  }
  return ctx.userSites;
}
```

### 3.5 Role Default Features

```typescript
// src/lib/permissions/roles.ts

export const ROLE_FEATURES: Record<Role, Feature[]> = {
  super_admin: Object.values(FEATURES), // All features

  admin: [
    // Content features
    "pages",
    "solutions",
    "navigation",
    "filters",
    "media",
    "parameters",
    // Global features
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
};
```

---

## 4. API Design

### 4.1 New API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/users` | GET | List all users with roles and site assignments |
| `/api/admin/users` | POST | Create a new user |
| `/api/admin/users/[id]` | GET | Get user details |
| `/api/admin/users/[id]` | PATCH | Update user role/permissions |
| `/api/admin/users/[id]` | DELETE | Delete user |
| `/api/admin/users/[id]/sites` | PUT | Update user site assignments |
| `/api/admin/sites` | GET | List all sites |
| `/api/admin/sites` | POST | Create a new site |
| `/api/admin/sites/[id]` | GET | Get site details |
| `/api/admin/sites/[id]` | PATCH | Update site |
| `/api/admin/sites/[id]` | DELETE | Delete site |
| `/api/admin/sites/current` | GET | Get current site from context |

### 4.2 Existing Routes Requiring Modification

All content API routes need to be updated to:
1. Check feature permissions
2. Filter by site_id based on user's site assignments
3. Include site_id in create/update operations

**Priority routes to modify:**
- `/api/admin/content/pages/*`
- `/api/admin/content/solutions/*`
- `/api/admin/content/navigation/*`
- `/api/admin/content/filters/*`
- `/api/admin/content/media/*`
- `/api/admin/content/site-parameters`

### 4.3 Authorization Middleware Design

```typescript
// src/lib/permissions/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { hasFeatureAccess, canAccessSite } from "./check";

interface ProtectOptions {
  feature: Feature;
  siteId?: string; // If provided, also check site access
}

export async function protectRoute(
  request: NextRequest,
  options: ProtectOptions
): Promise<{ authorized: boolean; response?: NextResponse; ctx?: PermissionContext }> {
  const session = await getSession();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userSites = await getUserSites(session.user.id);
  const ctx: PermissionContext = {
    user: {
      id: session.user.id,
      role: session.user.role as Role,
      featureOverrides: session.user.featureOverrides,
    },
    userSites,
  };

  // Check feature access
  if (!hasFeatureAccess(ctx, options.feature)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  // Check site access if site-scoped
  if (options.siteId && !canAccessSite(ctx, options.siteId)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, ctx };
}
```

### 4.4 Helper Functions

```typescript
// src/lib/permissions/helpers.ts

/**
 * Get the current site from URL or session context
 */
export async function getCurrentSiteId(request: NextRequest): Promise<string | null> {
  // Check URL parameter first
  const url = new URL(request.url);
  const siteId = url.searchParams.get("site_id");
  if (siteId) return siteId;

  // Check cookie/session for default site
  const session = await getSession();
  return session?.user?.defaultSiteId || null;
}

/**
 * Build a WHERE clause for site filtering
 */
export function getSiteFilter(
  ctx: PermissionContext,
  siteId?: string
): { siteIds: string[] } | { all: true } {
  if (ctx.user.role === "super_admin") {
    return siteId ? { siteIds: [siteId] } : { all: true };
  }

  if (siteId) {
    if (!ctx.userSites.includes(siteId)) {
      throw new Error("Access denied to site");
    }
    return { siteIds: [siteId] };
  }

  return { siteIds: ctx.userSites };
}
```

---

## 5. Admin UI Design

### 5.1 New Admin Pages

#### `/admin/users` - User Management

```
┌─────────────────────────────────────────────────────────────┐
│ Users                                         [+ New User]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Name          │ Email              │ Role    │ Sites    │ │
│ ├───────────────┼────────────────────┼─────────┼──────────┤ │
│ │ Jeremy        │ jeremy@example.com │ Super   │ All      │ │
│ │ Bart          │ bart@example.com   │ Admin   │ Assymo   │ │
│ │ Willem        │ willem@example.com │ Editor  │ VPG      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**User Edit Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│ Edit User                                              [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Name:  [Willem                                          ]   │
│ Email: [willem@example.com                              ]   │
│                                                             │
│ Role:  [Content Editor ▼]                                   │
│                                                             │
│ Site Access:                                                │
│ ☐ Assymo                                                    │
│ ☑ VPG                                                       │
│                                                             │
│ Feature Overrides:                     (optional)           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Pages     ☑ Solutions   ☑ Navigation                 │ │
│ │ ☑ Filters   ☑ Media       ☑ Parameters                 │ │
│ │ ☐ Appointments (disabled for content_editor)           │ │
│ │ ☐ Emails (disabled for content_editor)                 │ │
│ │ ☐ Conversations (disabled for content_editor)          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                            [Cancel]  [Save Changes]         │
└─────────────────────────────────────────────────────────────┘
```

#### `/admin/sites` - Site Management

```
┌─────────────────────────────────────────────────────────────┐
│ Sites                                         [+ New Site]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Name    │ Slug    │ Domain      │ Status  │ Users      │ │
│ ├─────────┼─────────┼─────────────┼─────────┼────────────┤ │
│ │ Assymo  │ assymo  │ assymo.be   │ Active  │ 2 users    │ │
│ │ VPG     │ vpg     │ vpg.be      │ Active  │ 1 user     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Navigation Structure Changes

**Current AdminSidebar items:**
```
- Afspraken (appointments)
- E-mails
- Conversaties
- Instellingen
─────────────────────
Content:
- Pagina's
- Realisaties
- Media
- Filters
- Navigatie
- Parameters
```

**Updated AdminSidebar with permissions:**
```typescript
// src/components/admin/AdminSidebar.tsx

const navItems = [
  { href: "/admin/appointments", label: "Afspraken", feature: "appointments" },
  { href: "/admin/emails", label: "E-mails", feature: "emails" },
  { href: "/admin/conversations", label: "Conversaties", feature: "conversations" },
  { href: "/admin/settings", label: "Instellingen", feature: "settings" },
];

const contentItems = [
  { href: "/admin/content/pages", label: "Pagina's", feature: "pages" },
  { href: "/admin/content/solutions", label: "Realisaties", feature: "solutions" },
  { href: "/admin/content/media", label: "Media", feature: "media" },
  { href: "/admin/content/filters", label: "Filters", feature: "filters" },
  { href: "/admin/content/navigation", label: "Navigatie", feature: "navigation" },
  { href: "/admin/content/parameters", label: "Parameters", feature: "parameters" },
];

const adminItems = [
  { href: "/admin/users", label: "Gebruikers", feature: "users" },
  { href: "/admin/sites", label: "Sites", feature: "sites" },
];
```

**Site Selector Component:**
```
┌─────────────────────────────────────┐
│ Site: [Assymo ▼]                    │
│       ├── Assymo                    │
│       └── VPG                       │
└─────────────────────────────────────┘
```

### 5.3 Component Hierarchy

```
AdminSidebar
├── SiteSelectorDropdown (new)
│   └── Shows only sites user has access to
├── NavItems (filtered by permissions)
├── ContentItems (filtered by permissions)
└── AdminItems (super_admin only)

AdminLayout
├── AdminSidebar
├── Header
│   ├── Breadcrumbs
│   └── CurrentSiteIndicator (new)
└── Content Area
```

---

## 6. Integration with Better Auth

### 6.1 Extended User Model

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";

export const auth = betterAuth({
  appName: "Assymo Admin",
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  user: {
    additionalFields: {
      mfaChoiceCompleted: {
        type: "boolean",
        defaultValue: false,
      },
      role: {
        type: "string",
        defaultValue: "content_editor",
        input: false,
      },
      featureOverrides: {
        type: "json",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  // ... rest of config
});

// Enhanced session type
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
```

### 6.2 Session Data Structure

After extending the user model, sessions will include:

```typescript
interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    // Custom fields
    mfaChoiceCompleted: boolean;
    role: "super_admin" | "admin" | "content_editor";
    featureOverrides: {
      grants?: string[];
      revokes?: string[];
    } | null;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };
}
```

### 6.3 Client-Side Permission Hooks

```typescript
// src/lib/permissions/hooks.ts
"use client";

import { useSession } from "@/lib/auth-client";
import { hasFeatureAccess, type Feature, type Role } from "./check";

export function usePermissions() {
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const role = user?.role as Role | undefined;

  const checkFeature = (feature: Feature): boolean => {
    if (!user || !role) return false;
    return hasFeatureAccess({
      user: {
        id: user.id,
        role,
        featureOverrides: user.featureOverrides,
      },
      userSites: [], // Client doesn't need site info for feature checks
    }, feature);
  };

  return {
    isPending,
    isAuthenticated: !!session,
    user,
    role,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin" || role === "super_admin",
    hasFeature: checkFeature,
  };
}

// Usage in components
function AdminSidebar() {
  const { hasFeature, isSuperAdmin } = usePermissions();

  return (
    <nav>
      {hasFeature("appointments") && (
        <Link href="/admin/appointments">Appointments</Link>
      )}
      {isSuperAdmin && (
        <Link href="/admin/users">Users</Link>
      )}
    </nav>
  );
}
```

### 6.4 Auth Client Configuration

```typescript
// src/lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient(),
    passkeyClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        featureOverrides: { type: "json" },
      },
    }),
  ],
});

export const { useSession, signOut } = authClient;
```

---

## 7. Implementation Phases

### Phase 1: Database Schema Foundation
**Duration:** 1 session
**Dependencies:** None

**Files to create:**
- `src/lib/permissions/types.ts` - Type definitions for roles, features, permissions

**Files to modify:**
- `src/lib/auth.ts` - Add role and featureOverrides additionalFields

**Database changes:**
```sql
-- Add role column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'content_editor';

-- Add feature_overrides column
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS feature_overrides JSONB;

-- Create sites table
CREATE TABLE sites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sites junction table
CREATE TABLE user_sites (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, site_id)
);

-- Insert initial sites
INSERT INTO sites (name, slug, domain) VALUES
  ('Assymo', 'assymo', 'assymo.be'),
  ('VPG', 'vpg', 'vpg.be');

-- Set Jeremy as super_admin (update with actual user ID)
UPDATE "user" SET role = 'super_admin' WHERE email = 'jeremy@example.com';
```

**Verification:**
- [ ] User table has `role` column with default 'content_editor'
- [ ] User table has `feature_overrides` JSONB column
- [ ] Sites table exists with initial data
- [ ] user_sites table exists
- [ ] Existing users remain functional (sign in works)

---

### Phase 2: Permission Utilities
**Duration:** 1 session
**Dependencies:** Phase 1 complete

**Files to create:**
- `src/lib/permissions/constants.ts` - Role and feature constants
- `src/lib/permissions/check.ts` - Permission checking functions
- `src/lib/permissions/queries.ts` - Database queries for user sites
- `src/lib/permissions/index.ts` - Public exports

**Files to modify:**
- None (additive phase)

**Verification:**
```typescript
// Test in a script or test file
import { hasFeatureAccess, ROLES, FEATURES } from "@/lib/permissions";

const ctx = {
  user: { id: "1", role: "content_editor", featureOverrides: null },
  userSites: ["site-1"],
};

console.assert(hasFeatureAccess(ctx, "pages") === true);
console.assert(hasFeatureAccess(ctx, "appointments") === false);
console.assert(hasFeatureAccess(ctx, "users") === false);
```

- [ ] Permission check functions work correctly for all roles
- [ ] Feature override grants work
- [ ] Feature override revokes work
- [ ] Existing functionality unchanged

---

### Phase 3: Route Protection
**Duration:** 1 session
**Dependencies:** Phase 2 complete

**Files to create:**
- `src/lib/permissions/middleware.ts` - Route protection helper

**Files to modify:**
- `src/lib/auth-utils.ts` - Add `getPermissionContext()` function
- `src/app/api/admin/appointments/route.ts` - Add feature check (example)
- `src/app/api/admin/conversations/route.ts` - Add feature check (example)

**Implementation pattern:**
```typescript
// Before (existing)
export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of handler
}

// After
export async function GET() {
  const { authorized, response, ctx } = await protectRoute({
    feature: "appointments",
  });
  if (!authorized) return response;
  // ... rest of handler
}
```

**Verification:**
- [ ] Unauthenticated requests return 401
- [ ] Users without feature access return 403
- [ ] Users with feature access can proceed
- [ ] Super admin can access all routes
- [ ] Existing admin functionality unchanged for current users

---

### Phase 4: User Management UI
**Duration:** 1-2 sessions
**Dependencies:** Phase 3 complete

**Files to create:**
- `src/app/admin/users/page.tsx` - User list page
- `src/app/api/admin/users/route.ts` - GET/POST users
- `src/app/api/admin/users/[id]/route.ts` - GET/PATCH/DELETE user
- `src/app/api/admin/users/[id]/sites/route.ts` - PUT user sites
- `src/components/admin/UserEditDialog.tsx` - User edit modal
- `src/components/admin/UserSiteSelector.tsx` - Site assignment checkboxes
- `src/components/admin/FeatureOverrideEditor.tsx` - Feature toggle grid

**Files to modify:**
- `src/components/admin/AdminSidebar.tsx` - Add Users link (super_admin only)
- `src/app/admin/layout.tsx` - Update breadcrumbs

**Verification:**
- [ ] User list displays all users with roles
- [ ] Can create new user (super_admin only)
- [ ] Can edit user role and site assignments
- [ ] Can configure feature overrides
- [ ] Non-super_admin cannot access /admin/users
- [ ] Changes persist correctly

---

### Phase 5: Site Management and Content Scoping
**Duration:** 1-2 sessions
**Dependencies:** Phase 4 complete

**Files to create:**
- `src/app/admin/sites/page.tsx` - Site list page
- `src/app/api/admin/sites/route.ts` - GET/POST sites
- `src/app/api/admin/sites/[id]/route.ts` - GET/PATCH/DELETE site
- `src/components/admin/SiteSelector.tsx` - Site dropdown for content filtering
- `src/lib/permissions/site-context.ts` - Site context management

**Files to modify:**
- `src/components/admin/AdminSidebar.tsx` - Add site selector and Sites link
- `src/app/admin/layout.tsx` - Add site context provider

**Database changes:**
```sql
-- Add site_id to content tables
ALTER TABLE pages ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE solutions ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE filters ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE filter_categories ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE navigation_links ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE image_metadata ADD COLUMN site_id TEXT REFERENCES sites(id);

-- Assign existing content to default site (Assymo)
UPDATE pages SET site_id = (SELECT id FROM sites WHERE slug = 'assymo');
UPDATE solutions SET site_id = (SELECT id FROM sites WHERE slug = 'assymo');
UPDATE filters SET site_id = (SELECT id FROM sites WHERE slug = 'assymo');
UPDATE filter_categories SET site_id = (SELECT id FROM sites WHERE slug = 'assymo');
UPDATE navigation_links SET site_id = (SELECT id FROM sites WHERE slug = 'assymo');
UPDATE image_metadata SET site_id = (SELECT id FROM sites WHERE slug = 'assymo');

-- Make site_id NOT NULL after migration
ALTER TABLE pages ALTER COLUMN site_id SET NOT NULL;
-- ... etc for other tables
```

**Verification:**
- [ ] Site selector appears in sidebar
- [ ] Content lists filter by selected site
- [ ] Users only see sites they have access to
- [ ] New content is created with correct site_id
- [ ] Existing content migrated to default site

---

### Phase 6: Content API Updates
**Duration:** 1-2 sessions
**Dependencies:** Phase 5 complete

**Files to modify:**
- `src/app/api/admin/content/pages/route.ts`
- `src/app/api/admin/content/pages/[id]/route.ts`
- `src/app/api/admin/content/solutions/route.ts`
- `src/app/api/admin/content/solutions/[id]/route.ts`
- `src/app/api/admin/content/navigation/route.ts`
- `src/app/api/admin/content/filters/route.ts`
- `src/app/api/admin/content/media/route.ts`
- `src/lib/content.ts` - Add site filtering to public queries

**Pattern for updates:**
```typescript
// Add site filtering to queries
const siteFilter = getSiteFilter(ctx, requestedSiteId);
const rows = await sql`
  SELECT * FROM pages
  WHERE site_id = ANY(${siteFilter.siteIds})
  ORDER BY title
`;

// Add site_id to create operations
const rows = await sql`
  INSERT INTO pages (title, slug, site_id, sections)
  VALUES (${title}, ${slug}, ${siteId}, '[]'::jsonb)
  RETURNING *
`;
```

**Verification:**
- [ ] List endpoints filter by user's accessible sites
- [ ] Create endpoints require valid site_id
- [ ] Update endpoints verify site access
- [ ] Delete endpoints verify site access
- [ ] Cross-site access returns 403

---

### Phase 7: Refinements and Edge Cases
**Duration:** 1 session
**Dependencies:** Phase 6 complete

**Tasks:**
1. Update public content routes to support multi-site
2. Add site-specific site_parameters
3. Update navigation/breadcrumbs for site context
4. Add user's default site preference
5. Handle edge cases (last admin, site deletion with content, etc.)

**Files to modify:**
- `src/lib/content.ts` - Support site filtering for public pages
- `src/app/admin/layout.tsx` - Site-aware breadcrumbs
- Various API routes for edge case handling

**Verification:**
- [ ] Public site serves correct content based on domain
- [ ] Admin remembers last selected site
- [ ] Cannot delete site with assigned users
- [ ] Cannot delete last super_admin
- [ ] All features work end-to-end for all three user types

---

## 8. Migration Path

### 8.1 Migrating Existing Users

The existing users will be migrated as follows:

1. **Before Phase 1:**
   - Identify existing user IDs in the database
   - Document which user should have which role

2. **During Phase 1:**
   - Run schema migrations
   - Update existing users with correct roles:
     ```sql
     -- Set Jeremy as super_admin
     UPDATE "user" SET role = 'super_admin'
     WHERE email = 'jeremy@example.com';

     -- Set Bart as admin with Assymo access
     UPDATE "user" SET role = 'admin'
     WHERE email = 'bart@example.com';

     INSERT INTO user_sites (user_id, site_id)
     SELECT u.id, s.id
     FROM "user" u, sites s
     WHERE u.email = 'bart@example.com' AND s.slug = 'assymo';

     -- Set Willem as content_editor with VPG access
     UPDATE "user" SET role = 'content_editor'
     WHERE email = 'willem@example.com';

     INSERT INTO user_sites (user_id, site_id)
     SELECT u.id, s.id
     FROM "user" u, sites s
     WHERE u.email = 'willem@example.com' AND s.slug = 'vpg';
     ```

### 8.2 Migrating Existing Content

During Phase 5:

1. Create a backup before migration
2. Assign all existing content to the default site (Assymo)
3. Verify content appears correctly in admin
4. Move specific content to VPG site as needed via admin UI

### 8.3 Rollback Strategy

**Phase 1-3 rollback:**
- The `role` column has a default value, so removing permission checks will restore original behavior
- Drop new tables: `DROP TABLE user_sites; DROP TABLE sites;`
- Remove new columns: `ALTER TABLE "user" DROP COLUMN role, DROP COLUMN feature_overrides;`

**Phase 4-7 rollback:**
- More complex due to site_id dependencies
- Would require restoring from backup or:
  1. Remove NOT NULL constraint from site_id columns
  2. Revert API route changes
  3. Remove site_id columns

**Recommended approach:**
- Take full database backup before each phase
- Test thoroughly in staging before production
- Each phase should be independently deployable

---

## Verification Checklist

### Design Coverage
- [x] Covers all current admin features in permission matrix
- [x] Schema changes are backward compatible (defaults for all new columns)
- [x] Each implementation phase is independently testable
- [x] Addresses all three initial users' access patterns:
  - Jeremy: super_admin with full access
  - Bart: admin with Assymo site access
  - Willem: content_editor with VPG site access
- [x] Integration with Better Auth clearly explained (additionalFields approach)
- [x] Pragmatic design for current scale (3 users, 2 sites)

### Technical Considerations
- [x] Uses existing patterns (Radix UI, existing form components)
- [x] Sign-up remains disabled (admin creates users)
- [x] Existing functionality continues working during phased rollout
- [x] No over-engineering (simple role enum, optional feature overrides)
