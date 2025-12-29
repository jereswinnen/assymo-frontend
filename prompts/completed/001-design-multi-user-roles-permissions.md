<research_objective>
Design a multi-user roles and permissions system for an existing Next.js admin CMS that:
1. Supports multiple sites (multi-tenant content management)
2. Uses role-based access control (RBAC) with per-user feature overrides
3. Integrates with the existing Better Auth authentication system
4. Provides a full admin UI for managing users, roles, and site assignments

This is a RESEARCH AND DESIGN task - produce a comprehensive design document, not code.
</research_objective>

<context>
This is an admin CMS with the following existing features that need permission control:

**Content Features** (site-specific):
- Pages editor (`/admin/content/pages`)
- Solutions editor (`/admin/content/solutions`)
- Navigation management (`/admin/content/navigation`)
- Filters management (`/admin/content/filters`)
- Media library (`/admin/content/media`)

**Site-wide Features** (not site-specific):
- Appointments management (`/admin/appointments`)
- Conversations viewer (`/admin/conversations`)
- Email/newsletter management (`/admin/emails`)

**Current Users Plan**:
- Jeremy (super admin) - full access to everything, all sites
- Bart (admin) - full access to main site (Assymo)
- Willem (admin) - access to VPG site only, content features only (no appointments, emails, conversations)

**Technical Stack**:
- Next.js 16 with App Router
- Better Auth (with TOTP and passkeys)
- Neon Postgres (serverless)
- Existing user table from Better Auth

**Multi-site Approach** (already decided):
- Same database with `site_id` column on content tables
- Content tables: pages, solutions, navigation_items, filters, images, etc.
- Users can be assigned to one or more sites
</context>

<research>
Before designing, thoroughly analyze:

1. **Existing auth setup**: Read `src/lib/auth.ts` and `src/lib/auth-client.ts` to understand the current Better Auth configuration and user schema

2. **Admin route structure**: Examine `src/app/admin/` to understand all protected routes and how they're organized

3. **Database schema**: Look at existing migrations or schema files to understand current table structure, especially user-related tables from Better Auth

4. **Content tables**: Identify all tables that need a `site_id` column for multi-site support

5. **Better Auth extension points**: Research how to add custom fields (role, site assignments, feature permissions) to Better Auth users
</research>

<design_requirements>

<permission_model>
Design a hybrid RBAC + feature toggle system:

**Roles** (predefined permission sets):
- `super_admin`: Full access to all features and all sites
- `admin`: Full access to assigned site(s), all features
- `content_editor`: Content features only (pages, solutions, nav, filters, media) for assigned site(s)
- Consider if additional roles are needed

**Per-user Feature Overrides**:
- Ability to grant or revoke specific features beyond the role's defaults
- Example: An admin with appointments feature disabled

**Site Assignments**:
- Users can be assigned to one or more sites
- Content features are scoped to assigned sites
- Some features (appointments, emails, conversations) may be site-specific or global
</permission_model>

<data_model>
Design the database schema additions:

1. **Sites table**: Store site configurations
2. **Roles table** (or enum): Define available roles
3. **User extensions**: How to extend Better Auth's user table with role and permissions
4. **User-site assignments**: Junction table for user-to-site relationships
5. **Feature permissions**: How to store per-user feature overrides
6. **Content table modifications**: Adding `site_id` to existing content tables
</data_model>

<admin_ui>
Design admin pages for:

1. **User management** (`/admin/users`):
   - List all users with their roles and site assignments
   - Create/edit user modal or page
   - Assign roles to users
   - Assign users to sites
   - Configure per-user feature overrides

2. **Site management** (`/admin/sites`):
   - List sites
   - Create/edit sites
   - View users assigned to each site

3. **Navigation updates**:
   - How admin sidebar should adapt based on user permissions
   - Which items to show/hide based on features and site context
</admin_ui>

<authorization_implementation>
Design the authorization check system:

1. **Server-side checks**: How to protect API routes and server actions
2. **Client-side checks**: How to conditionally render UI elements
3. **Middleware approach**: Route-level protection strategy
4. **Helper functions**: Reusable permission check utilities
</authorization_implementation>

</design_requirements>

<deliverables>

Create a design document at `./docs/MULTI-USER-DESIGN.md` containing:

## 1. Executive Summary
Brief overview of the solution

## 2. Data Model
- Complete schema design with table definitions
- Relationships diagram (can be ASCII art)
- Migration strategy for existing tables

## 3. Permission System Design
- Role definitions and their default permissions
- Feature permission matrix
- Site-scoping logic

## 4. API Design
- New API routes needed
- Existing routes that need modification
- Authorization middleware design

## 5. Admin UI Design
- Wireframes or descriptions of new admin pages
- Navigation structure changes
- Component hierarchy

## 6. Integration with Better Auth
- How to extend the user model
- Session data structure with permissions
- Client-side permission hooks

## 7. Implementation Phases

**CRITICAL**: Break the implementation into small, incremental phases. Each phase should:
- Be completable in a single focused session
- Have clear start and end points
- Be independently testable
- Not break existing functionality during implementation

Suggested phase structure:
- **Phase 1**: Database schema (sites table, role field, minimal migrations)
- **Phase 2**: Permission utilities (helper functions, no UI yet)
- **Phase 3**: Route protection (middleware/guards)
- **Phase 4**: User management UI (basic CRUD)
- **Phase 5**: Site management and content scoping
- **Phase 6**: Feature toggles and refinements

Each phase should list:
- Specific files to create/modify
- Database changes if any
- How to verify the phase is complete
- Dependencies on previous phases

## 8. Migration Path
- How to migrate existing users
- How to migrate existing content
- Rollback strategy

</deliverables>

<constraints>
- Must work with existing Better Auth setup (don't replace auth system)
- Sign-up remains disabled (users created by super admin only)
- Existing admin functionality must continue working during phased rollout
- Use existing patterns from the codebase (Radix UI, existing form patterns, etc.)
- Keep the solution pragmatic - this is for 3 users initially, not enterprise scale
</constraints>

<verification>
Before completing, verify the design document:
- [ ] Covers all current admin features in permission matrix
- [ ] Schema changes are backward compatible
- [ ] Each implementation phase is truly independent and small
- [ ] Addresses all three initial users' access patterns (Jeremy, Bart, Willem)
- [ ] Integration with Better Auth is clearly explained
- [ ] No over-engineering for the current scale
</verification>

<success_criteria>
- Comprehensive design document saved to `./docs/MULTI-USER-DESIGN.md`
- Schema design that extends (not replaces) Better Auth
- Clear permission model with RBAC + feature overrides
- Phased implementation plan with 5-7 small, incremental phases
- Each phase has specific files, changes, and verification steps
- Design supports the three initial users with their specific access needs
</success_criteria>
