# Multi-Site Content System

<objective>
Implement a multi-site content management system that allows the Assymo admin panel to manage content for multiple websites (Assymo + sister company). Each site has exclusive content, managed from a single admin interface with a site switcher.
</objective>

<context>
## Current Architecture

- **Database**: Neon Postgres with content tables (pages, solutions, navigation_links, filter_categories, filters, site_parameters)
- **Admin Panel**: Next.js app at `/admin/*` with Better Auth authentication
- **Content Fetching**: `src/lib/content.ts` queries Postgres directly (server-side)
- **No multi-site support**: All content is shared, no site filtering

## Content Tables (from types/content.ts)

| Table | Purpose | Needs site column |
|-------|---------|-------------------|
| pages | Website pages with sections | Yes |
| solutions | Product/service pages | Yes |
| navigation_links | Header/footer nav | Yes |
| filter_categories | Solution filter groups | Yes |
| filters | Individual filters | Yes |
| site_parameters | Contact info, socials (singleton) | Yes (becomes per-site) |
| image_metadata | Alt text for images | No (shared) |
| document_chunks | RAG embeddings for chatbot | No (Assymo-only) |

## Desired Outcome

1. Admin can switch between sites in the sidebar
2. Content lists only show content for the selected site
3. New content is automatically assigned to the selected site
4. Sister site fetches content by passing its site identifier to content.ts functions
</context>

<requirements>
## Phase 1: Database Schema Changes

### 1.1 Create sites table
```sql
CREATE TABLE sites (
  id VARCHAR(50) PRIMARY KEY,  -- e.g., 'assymo', 'sister-brand'
  name VARCHAR(100) NOT NULL,  -- Display name
  domain VARCHAR(255),         -- Optional: for reference
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial sites
INSERT INTO sites (id, name, domain) VALUES
  ('assymo', 'Assymo', 'assymo.nl'),
  ('sister', 'Sister Brand', 'sister-brand.nl');
```

### 1.2 Add site column to content tables
```sql
-- Add site_id column with default 'assymo' for existing content
ALTER TABLE pages ADD COLUMN site_id VARCHAR(50) NOT NULL DEFAULT 'assymo' REFERENCES sites(id);
ALTER TABLE solutions ADD COLUMN site_id VARCHAR(50) NOT NULL DEFAULT 'assymo' REFERENCES sites(id);
ALTER TABLE navigation_links ADD COLUMN site_id VARCHAR(50) NOT NULL DEFAULT 'assymo' REFERENCES sites(id);
ALTER TABLE filter_categories ADD COLUMN site_id VARCHAR(50) NOT NULL DEFAULT 'assymo' REFERENCES sites(id);
ALTER TABLE filters ADD COLUMN site_id VARCHAR(50) NOT NULL DEFAULT 'assymo' REFERENCES sites(id);

-- site_parameters: change from singleton to per-site
ALTER TABLE site_parameters DROP CONSTRAINT IF EXISTS site_parameters_pkey;
ALTER TABLE site_parameters ADD COLUMN site_id VARCHAR(50) NOT NULL DEFAULT 'assymo' REFERENCES sites(id);
ALTER TABLE site_parameters ADD PRIMARY KEY (site_id);
-- Note: existing row becomes the 'assymo' site parameters

-- Create indexes for efficient filtering
CREATE INDEX idx_pages_site ON pages(site_id);
CREATE INDEX idx_solutions_site ON solutions(site_id);
CREATE INDEX idx_navigation_links_site ON navigation_links(site_id);
CREATE INDEX idx_filter_categories_site ON filter_categories(site_id);
CREATE INDEX idx_filters_site ON filters(site_id);
```

### 1.3 Update unique constraints
```sql
-- Slugs must be unique per site, not globally
DROP INDEX IF EXISTS pages_slug_key;
CREATE UNIQUE INDEX pages_slug_site_key ON pages(slug, site_id) WHERE slug IS NOT NULL;

DROP INDEX IF EXISTS solutions_slug_key;
CREATE UNIQUE INDEX solutions_slug_site_key ON solutions(slug, site_id);

-- is_homepage must be unique per site
DROP INDEX IF EXISTS pages_is_homepage_key;
CREATE UNIQUE INDEX pages_is_homepage_site_key ON pages(site_id) WHERE is_homepage = true;
```

## Phase 2: Backend Changes

### 2.1 Update content.ts functions
Add `siteId` parameter to all content fetching functions:

```typescript
export async function getPageBySlug(slug: string, siteId: string): Promise<Page | null> {
  const rows = await sql`
    SELECT p.*, im.alt_text as header_image_alt
    FROM pages p
    LEFT JOIN image_metadata im ON im.url = p.header_image->>'url'
    WHERE p.slug = ${slug} AND p.site_id = ${siteId}
  `;
  // ...
}

export async function getHomepage(siteId: string): Promise<Page | null> {
  const rows = await sql`
    SELECT p.*, im.alt_text as header_image_alt
    FROM pages p
    LEFT JOIN image_metadata im ON im.url = p.header_image->>'url'
    WHERE p.is_homepage = true AND p.site_id = ${siteId}
    LIMIT 1
  `;
  // ...
}

// Similar updates for: getAllPages, getSolutionBySlug, getAllSolutions,
// getFilterCategories, getNavigation, getSiteParameters
```

### 2.2 Create site configuration
New file: `src/lib/site.ts`

```typescript
// Site identifier - set per deployment
export const SITE_ID = process.env.SITE_ID || 'assymo';

// Helper to get site ID in server components
export function getSiteId(): string {
  return SITE_ID;
}
```

### 2.3 Update all page routes
Update all `(site)` routes to pass siteId:

```typescript
// src/app/(site)/page.tsx
import { getSiteId } from '@/lib/site';

export default async function Home() {
  const siteId = getSiteId();
  const page = await getHomepage(siteId);
  // ...
}
```

### 2.4 Update admin API routes
All `/api/admin/content/*` routes need:
1. Accept `site_id` in request body for creates
2. Filter by `site_id` in queries
3. Read `site_id` from a cookie/header set by the site switcher

## Phase 3: Admin UI Changes

### 3.1 Site switcher in sidebar
Add a site selector dropdown in `AdminSidebar.tsx`:

```typescript
// At the top of sidebar, below logo
<SiteSwitcher currentSite={currentSite} sites={sites} />
```

### 3.2 Site context provider
New file: `src/components/admin/SiteContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface SiteContextType {
  currentSite: string;
  setSite: (siteId: string) => void;
  sites: Array<{ id: string; name: string }>;
}

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children, initialSites }: {
  children: React.ReactNode;
  initialSites: Array<{ id: string; name: string }>;
}) {
  const [currentSite, setCurrentSite] = useState(() => {
    // Load from localStorage or default to 'assymo'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-site') || 'assymo';
    }
    return 'assymo';
  });

  const setSite = (siteId: string) => {
    setCurrentSite(siteId);
    localStorage.setItem('admin-site', siteId);
    // Also set a cookie for API routes
    document.cookie = `admin-site=${siteId}; path=/`;
  };

  return (
    <SiteContext.Provider value={{ currentSite, setSite, sites: initialSites }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used within SiteProvider');
  return context;
}
```

### 3.3 Update admin layout
Wrap admin layout with SiteProvider:

```typescript
// src/app/admin/layout.tsx
import { SiteProvider } from '@/components/admin/SiteContext';

// Fetch sites from DB
const sites = await getSites();

return (
  <SiteProvider initialSites={sites}>
    <SidebarProvider>
      {/* ... */}
    </SidebarProvider>
  </SiteProvider>
);
```

### 3.4 Update content list pages
Each content list page reads from site context:

```typescript
// src/app/admin/content/pages/page.tsx
'use client';

import { useSite } from '@/components/admin/SiteContext';

export default function PagesPage() {
  const { currentSite } = useSite();

  // Fetch pages for current site
  const { data: pages } = useSWR(
    `/api/admin/content/pages?site=${currentSite}`
  );
  // ...
}
```

### 3.5 Update content forms
When creating/editing content, include site_id:

```typescript
// In page editor
const { currentSite } = useSite();

const handleSave = async (data) => {
  await fetch('/api/admin/content/pages', {
    method: 'POST',
    body: JSON.stringify({ ...data, site_id: currentSite }),
  });
};
```

## Phase 4: Sister Site Setup

### 4.1 Environment configuration
Sister site's `.env`:
```
DATABASE_URL=<same Neon connection string>
SITE_ID=sister
```

### 4.2 Copy content.ts
Sister site gets a copy of `src/lib/content.ts` and `src/lib/site.ts` with its own SITE_ID.

### 4.3 No admin panel
Sister site doesn't need `/admin` routes - all content managed from Assymo admin.
</requirements>

<implementation_phases>
## Phase 1: Database Schema (30 min)
1. Create migration SQL file
2. Run migration on Neon
3. Verify existing content has `site_id = 'assymo'`

## Phase 2: Backend Updates (1-2 hours)
1. Create `src/lib/site.ts` with SITE_ID config
2. Update all functions in `content.ts` to accept siteId parameter
3. Update all `(site)` page routes to pass siteId
4. Update all admin API routes to filter by site_id

## Phase 3: Admin UI (2-3 hours)
1. Create SiteContext provider
2. Build SiteSwitcher component
3. Update admin layout to wrap with SiteProvider
4. Update all content list pages to use site context
5. Update all content forms to include site_id
6. Test full CRUD flow with site switching

## Phase 4: Testing & Verification (30 min)
1. Create test content for both sites
2. Verify site switcher filters correctly
3. Verify content isolation (site A can't see site B's content)
4. Test slug uniqueness per site

## Phase 5: Sister Site Documentation
1. Document environment setup
2. Document which files to copy
3. Create setup guide for sister site deployment
</implementation_phases>

<files_to_modify>
## New Files
- `src/lib/site.ts` - Site configuration
- `src/components/admin/SiteContext.tsx` - React context for current site
- `src/components/admin/SiteSwitcher.tsx` - Dropdown component
- `docs/multi-site-migration.sql` - Database migration

## Modified Files
- `src/lib/content.ts` - Add siteId parameter to all functions
- `src/app/admin/layout.tsx` - Add SiteProvider
- `src/components/admin/AdminSidebar.tsx` - Add SiteSwitcher
- `src/app/(site)/page.tsx` - Pass siteId to content functions
- `src/app/(site)/[slug]/page.tsx` - Pass siteId
- `src/app/(site)/oplossingen/page.tsx` - Pass siteId
- `src/app/(site)/oplossingen/[slug]/page.tsx` - Pass siteId
- All `/api/admin/content/*` routes - Add site filtering
- `src/types/content.ts` - Add site_id to interfaces
</files_to_modify>

<success_criteria>
1. Admin can switch between sites using dropdown in sidebar
2. Content lists only show content for selected site
3. Creating new content assigns it to selected site
4. Slug uniqueness is enforced per-site (same slug can exist on different sites)
5. Site parameters are separate per site
6. Frontend (assymo.nl) only shows Assymo content
7. Sister site can connect to same DB and only see its content
8. No regressions in existing functionality
</success_criteria>

<decisions>
1. **Chatbot**: Assymo-only. No site_id needed for document_chunks.
2. **Sister site identifier**: TBD - use placeholder `'sister'` for now.
3. **Images**: Shared across sites. No changes to image_metadata.
4. **Appointments/Emails**: Assymo-only. No multi-site needed.

## Scope Summary

**Multi-site (needs `site_id`):**
- pages
- solutions
- navigation_links
- filter_categories
- filters
- site_parameters

**Assymo-only (no changes):**
- document_chunks, document_metadata
- chat_conversations, rate_limits
- appointments, appointment_closures, opening_hours, opening_hour_overrides
- newsletters, newsletter_subscribers
- contacts

**Shared (no changes):**
- image_metadata
- user, session, account, verification, twoFactor, passkey (auth tables)
</decisions>
