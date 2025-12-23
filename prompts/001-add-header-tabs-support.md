<objective>
Add support for centered tabs in the admin header layout, alongside the existing actions on the right side.

The goal is to create a reusable pattern where pages can optionally display tabs in the header (centered), while always keeping actions on the right. Detail pages (like email/[id]) should not show tabs - only list pages should.
</objective>

<context>
Read @CLAUDE.md for project conventions.

The admin layout is at `src/app/admin/layout.tsx` and uses:
- `AdminHeaderContext` for header actions via `useAdminHeaderActions` hook
- Breadcrumbs on the left side
- Actions rendered on the right side via `<AdminHeaderActions />`

The pattern should mirror how `useAdminHeaderActions` works - a hook that pages can call to set their tabs.

Reference files:
- `src/components/admin/AdminHeaderContext.tsx` - existing context for header actions
- `src/app/admin/layout.tsx` - admin layout with header
- `src/components/admin/EmailDashboard.tsx` - first consumer (has tabs for Nieuwsbrieven/Templates)
</context>

<requirements>
1. Extend `AdminHeaderContext` to support tabs:
   - Add `useAdminHeaderTabs` hook similar to `useAdminHeaderActions`
   - Tabs should accept ReactNode (the TabsList component)
   - Tabs should be cleared when navigating away (same as actions)

2. Update admin layout header:
   - Keep breadcrumbs on the left
   - Add centered section for tabs (only renders if tabs are set)
   - Keep actions on the right
   - Use CSS that handles gracefully when tabs are not present

3. Update EmailDashboard to use the new pattern:
   - Move TabsList to header via `useAdminHeaderTabs`
   - Keep TabsContent in the component body
   - Tabs component still wraps everything (for state management)

4. Ensure detail pages (like `/admin/emails/[id]`) don't show tabs:
   - They only use `useAdminHeaderActions`, not `useAdminHeaderTabs`
   - Header should look clean with just breadcrumbs and actions
</requirements>

<implementation>
Follow these steps in order:

1. Update `AdminHeaderContext.tsx`:
   - Add tabs state and setter
   - Create `useAdminHeaderTabs` hook
   - Export new `AdminHeaderTabs` component

2. Update `layout.tsx` header structure:
   - Restructure header to have 3 sections (left/center/right)
   - Center section renders `<AdminHeaderTabs />` if tabs are set
   - Ensure layout doesn't break when tabs are empty

3. Update `EmailDashboard.tsx`:
   - Import and use `useAdminHeaderTabs`
   - Move TabsList to header
   - Keep Tabs wrapper and TabsContent in place
</implementation>

<output>
Modified files:
- `src/components/admin/AdminHeaderContext.tsx`
- `src/app/admin/layout.tsx`
- `src/components/admin/EmailDashboard.tsx`
</output>

<verification>
Before completing:
1. Verify emails page shows tabs centered in header with actions on right
2. Verify email detail page (/admin/emails/[id]) shows only breadcrumbs and actions (no tabs)
3. Verify other admin pages without tabs still render correctly
4. Run `npx tsc --noEmit` to ensure no type errors
</verification>
