<objective>
Add a new 'user' role with granular permissions, implement site capabilities, AND clean up the sidebar architecture.

This enables:
1. Fine-grained user access control (user role with explicit feature/site grants)
2. Site-specific feature availability (e.g., VPG only has content, Assymo has content + business features)
3. Cleaner, more maintainable sidebar code
</objective>

<context>
Read the CLAUDE.md file for project conventions.

**Permissions system** in `src/lib/permissions/`:
- `types.ts` - Role definitions, ROLE_FEATURES mapping, Feature types
- `check.ts` - Permission checking logic (hasAccess, hasFeatureAccess, etc.)
- `queries.ts` - Database queries for user permissions
- `middleware.ts` - Route protection
- `site-context.tsx` - React context for current site

**Current role hierarchy** (in ROLE_HIERARCHY):
- super_admin: 100 (all features, all sites)
- admin: 50 (content + business features, assigned sites)
- content_editor: 10 (content features only, assigned sites)

**Database - Neon Postgres** (project: fragrant-salad-59219149):
- `sites` table has: id, name, slug, domain, is_active, created_at, updated_at
- `user` table has: role, feature_overrides (JSONB)
- `user_sites` table links users to sites

**Current sites:**
- Assymo (assymo.be) - Has ALL features (content + appointments, emails, conversations)
- VPG (vpg.be) - Has CONTENT features only (pages, solutions, navigation, filters, media, parameters)

**Current sidebar architecture** (needs cleanup):
- `src/components/admin/AdminSidebar.tsx` - Filters nav items based on effectiveFeatures
- `src/app/api/admin/user-permissions/route.ts` - Separate API to fetch fresh permissions
- `src/lib/permissions/site-context.tsx` - Provides current site but NOT capabilities
- Sidebar makes its own API call, duplicating data fetching
- Dynamic import with SSR disabled to prevent hydration issues

**User edit page** is at `src/app/admin/users/[id]/page.tsx`

UI strings are centralized in `src/config/strings.ts` - add new Dutch strings there.
</context>

<requirements>

## Part 1: Site Capabilities

1. **Database migration** - Add capabilities column to sites table:
   ```sql
   ALTER TABLE sites ADD COLUMN capabilities JSONB DEFAULT '[]'::jsonb;
   ```
   Then populate with current reality:
   - Assymo: all features
   - VPG: content features only (pages, solutions, navigation, filters, media, parameters)

2. **Update types** (`src/lib/permissions/types.ts`):
   - Add `capabilities` field to Site interface as `Feature[]`
   - Export a helper type for site capabilities

3. **Update site context** (`src/lib/permissions/site-context.tsx`):
   - Include capabilities when fetching sites
   - Expose `currentSiteCapabilities` from the context

4. **Update site edit page** (if exists, or create section in existing):
   - Allow super_admin to configure which features a site supports
   - Use checkboxes for each feature grouped by category

## Part 2: User Role with Granular Permissions

1. **Add 'user' role** to permissions system (`src/lib/permissions/types.ts`):
   - Add to ROLES constant with value "user"
   - Add to ROLE_HIERARCHY with value 1 (lowest)
   - Add to ROLE_FEATURES with empty array (no default features)

2. **Update user edit page** (`src/app/admin/users/[id]/page.tsx`):
   - When editing a user with role 'user', show permission configuration UI
   - Show checkboxes for each feature, grouped by category (Content / Business)
   - Only show features that are available on the user's assigned sites
   - Store selected features in `featureOverrides.grants`

3. **Create PermissionSelector component** (`src/components/admin/PermissionSelector.tsx`):
   - Receives: available features (filtered by assigned sites' capabilities)
   - Receives: currently granted features
   - Displays: grouped checkboxes with feature names
   - Returns: selected features array

4. **Verify permission checking** (`src/lib/permissions/check.ts`):
   - Ensure logic handles empty role defaults correctly
   - User role with no grants = no access to anything

## Part 3: Sidebar Architecture Cleanup

**Goal:** Consolidate data fetching and simplify the sidebar to consume a single `visibleFeatures` array.

1. **Enhance site-context** (`src/lib/permissions/site-context.tsx`):
   - Fetch user's effective features along with sites (combine the two API calls)
   - Compute `visibleFeatures` = user permissions ∩ current site capabilities
   - Expose `visibleFeatures` from the context
   - Re-compute when user switches sites

2. **Update or remove the permissions API** (`src/app/api/admin/user-permissions/route.ts`):
   - Option A: Remove entirely if site-context handles everything
   - Option B: Enhance to return capabilities too, used by site-context
   - Choose whichever is cleaner

3. **Simplify AdminSidebar** (`src/components/admin/AdminSidebar.tsx`):
   - Remove the separate `useEffect` that fetches permissions
   - Remove local `effectiveFeatures` state
   - Simply consume `visibleFeatures` from site-context
   - Remove the loading skeleton logic for permissions (context handles loading)
   - Keep the dynamic import for SSR if still needed for Radix components

4. **Single source of truth**:
   - All permission + capability logic lives in site-context
   - Sidebar just renders what it's told
   - Easier to maintain and reason about

## Part 4: UI Strings

Add to `src/config/strings.ts`:
- Role display names (including "user" → "Gebruiker")
- Permission selector labels
- Site capabilities labels
- All in Dutch, consistent with existing strings

</requirements>

<implementation>

**Execution order:**

1. Run database migration to add capabilities column
2. Update types.ts with Site.capabilities and user role
3. Refactor site-context.tsx:
   - Fetch sites with capabilities
   - Fetch user permissions
   - Compute and expose `visibleFeatures`
4. Simplify AdminSidebar to consume `visibleFeatures` from context
5. Remove or repurpose the user-permissions API route
6. Create/update site edit UI for capabilities configuration
7. Create PermissionSelector component
8. Update user edit page with permission UI for 'user' role
9. Add all Dutch strings to strings.ts
10. Test the full flow

**New site-context shape:**
```typescript
interface SiteContextValue {
  // Existing
  currentSite: Site | null;
  availableSites: Site[];
  setCurrentSite: (site: Site) => void;
  isLoading: boolean;

  // New
  currentSiteCapabilities: Feature[];
  visibleFeatures: Feature[];  // user permissions ∩ site capabilities
}
```

**Simplified sidebar logic:**
```typescript
// Before: fetch permissions, filter items, handle loading
// After: just use context
const { visibleFeatures, isLoading } = useSiteContext();

const visibleNavItems = navItems.filter(item =>
  visibleFeatures.includes(item.feature)
);
```

**Permission selector logic:**
```typescript
// Get features available across all user's assigned sites
const availableFeatures = userSites
  .flatMap(site => site.capabilities)
  .filter((f, i, arr) => arr.indexOf(f) === i); // unique
```

</implementation>

<output>
**Database:**
- Migration to add `capabilities` column to sites table

**Modified files:**
- `src/lib/permissions/types.ts` - Add user role + Site.capabilities
- `src/lib/permissions/site-context.tsx` - Major refactor: add permissions + capabilities + visibleFeatures
- `src/lib/permissions/check.ts` - Verify handles empty role defaults
- `src/components/admin/AdminSidebar.tsx` - Simplify to use context only
- `src/app/admin/users/[id]/page.tsx` - Add permission UI for user role
- `src/app/admin/sites/[id]/page.tsx` - Add capabilities configuration (if exists)
- `src/config/strings.ts` - Add Dutch strings

**New files:**
- `src/components/admin/PermissionSelector.tsx` - Reusable permission checkboxes

**Potentially removed:**
- `src/app/api/admin/user-permissions/route.ts` - If consolidated into site-context
</output>

<verification>
Before completing, verify:

1. **Build**: Run `pnpm build` to ensure no type errors

2. **Site capabilities**:
   - Check Assymo site shows all nav items for admin users
   - Check VPG site hides appointments/emails/conversations for all users
   - Verify super_admin can edit site capabilities

3. **User role**:
   - Create a test user with 'user' role
   - Verify they have no access by default
   - Grant them "pages" on Assymo, verify they can access pages
   - Verify they cannot access appointments even if granted (if not in their sites' capabilities)

4. **Sidebar behavior**:
   - Switch between Assymo and VPG as admin
   - Verify nav items change based on site capabilities
   - Verify no flash of incorrect items during loading
   - Verify permission intersection works correctly

5. **Architecture cleanup**:
   - Confirm sidebar no longer makes its own API call
   - Confirm all permission logic is in site-context
   - Verify the code is simpler and easier to follow

6. **Existing roles**: Verify admin and content_editor still work correctly
</verification>

<success_criteria>
- Site capabilities stored in database and configurable by super_admin
- Sidebar consumes single `visibleFeatures` from context (no separate API call)
- Site-context is the single source of truth for permissions + capabilities
- AdminSidebar code is significantly simpler
- 'user' role added with zero default access
- User edit page shows granular permission UI for 'user' role
- Permission grants limited to features available on assigned sites
- All UI text uses Dutch strings from strings.ts
- Build passes with no errors
- Existing roles (super_admin, admin, content_editor) unaffected
</success_criteria>
