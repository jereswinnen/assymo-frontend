# Content Management System - Build Plan

## Overview

Replace Sanity entirely with a custom content management system built into the admin panel. Content will be stored in Neon Postgres (already in use), and images will be stored via a cloud provider.

**Goal:** Full independence from Sanity - one less external dependency, full control, simpler architecture.

---

## Phase 1: Foundation

### 1.1 Database Schema

Create tables for all content types in Neon Postgres.

```sql
-- Core content types
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  header_image JSONB, -- { url, alt, hotspot? }
  sections JSONB DEFAULT '[]', -- Array of section objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  header_image JSONB,
  sections JSONB DEFAULT '[]',
  order_rank INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE filter_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  order_rank INTEGER DEFAULT 0
);

CREATE TABLE filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id UUID REFERENCES filter_categories(id) ON DELETE CASCADE,
  UNIQUE(slug, category_id)
);

-- Junction table for solution <-> filter many-to-many
CREATE TABLE solution_filters (
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
  filter_id UUID REFERENCES filters(id) ON DELETE CASCADE,
  PRIMARY KEY (solution_id, filter_id)
);

-- Navigation (singleton-ish, but stored as rows for flexibility)
CREATE TABLE navigation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL, -- 'header' or 'footer'
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  submenu_heading TEXT,
  order_rank INTEGER DEFAULT 0
);

CREATE TABLE navigation_subitems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES navigation_links(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL,
  order_rank INTEGER DEFAULT 0
);

-- Site parameters (singleton)
CREATE TABLE site_parameters (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures singleton
  address TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  vat_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images table (metadata, actual files in cloud storage)
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  alt TEXT,
  width INTEGER,
  height INTEGER,
  size INTEGER, -- bytes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_solutions_slug ON solutions(slug);
CREATE INDEX idx_solutions_order ON solutions(order_rank);
CREATE INDEX idx_filters_category ON filters(category_id);
CREATE INDEX idx_nav_links_location ON navigation_links(location);
```

**Effort:** Half day

### 1.2 Image Storage Setup

Choose one (recommendation: **Vercel Blob** if on Vercel, otherwise **Cloudinary**):

| Option | Pros | Cons |
|--------|------|------|
| Vercel Blob | Native integration, simple API | Vercel-only |
| Cloudinary | Great transforms, generous free tier | External service |
| AWS S3 | Full control, cheap | More setup |
| uploadthing | Popular in Next.js | Another dependency |

**Vercel Blob example:**
```typescript
// src/lib/storage.ts
import { put, del } from '@vercel/blob';

export async function uploadImage(file: File) {
  const blob = await put(file.name, file, { access: 'public' });
  return {
    url: blob.url,
    filename: file.name,
  };
}

export async function deleteImage(url: string) {
  await del(url);
}
```

**Effort:** Half day

### 1.3 Base API Routes

```
src/app/api/admin/content/
├── pages/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/route.ts      # GET, PUT, DELETE
├── solutions/
│   ├── route.ts
│   └── [id]/route.ts
├── filters/
│   └── route.ts           # GET, POST, PUT, DELETE (all in one)
├── filter-categories/
│   └── route.ts
├── navigation/
│   └── route.ts           # GET, PUT
├── site-parameters/
│   └── route.ts           # GET, PUT
└── images/
    └── upload/route.ts    # POST (upload), DELETE
```

**Example route:**
```typescript
// src/app/api/admin/content/pages/route.ts
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth-utils';

export async function GET() {
  if (!await isAuthenticated()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pages = await db.query(`
    SELECT id, title, slug, updated_at
    FROM pages
    ORDER BY title
  `);

  return Response.json(pages.rows);
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, slug, header_image, sections } = await req.json();

  const result = await db.query(`
    INSERT INTO pages (title, slug, header_image, sections)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [title, slug, header_image, JSON.stringify(sections)]);

  return Response.json(result.rows[0]);
}
```

**Effort:** 1-2 days

---

## Phase 2: Frontend Data Layer

### 2.1 Replace Sanity Client Calls

Create a new data layer to replace Sanity queries.

**Current (Sanity):**
```typescript
const page = await client.fetch(`*[_type == "page" && slug.current == $slug][0]`, { slug });
```

**New (Postgres):**
```typescript
// src/lib/content.ts
import { db } from './db';

export async function getPageBySlug(slug: string) {
  const result = await db.query(`
    SELECT * FROM pages WHERE slug = $1
  `, [slug]);
  return result.rows[0] || null;
}

export async function getAllSolutions() {
  const result = await db.query(`
    SELECT s.*,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    GROUP BY s.id
    ORDER BY s.order_rank
  `);
  return result.rows;
}

export async function getSolutionBySlug(slug: string) {
  // Similar query with filters included
}

export async function getNavigation(location: 'header' | 'footer') {
  const result = await db.query(`
    SELECT nl.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ns.id,
            'solution', json_build_object('name', s.name, 'slug', s.slug, 'header_image', s.header_image)
          )
          ORDER BY ns.order_rank
        ) FILTER (WHERE ns.id IS NOT NULL),
        '[]'
      ) as sub_items
    FROM navigation_links nl
    LEFT JOIN navigation_subitems ns ON nl.id = ns.link_id
    LEFT JOIN solutions s ON ns.solution_id = s.id
    WHERE nl.location = $1
    GROUP BY nl.id
    ORDER BY nl.order_rank
  `, [location]);
  return result.rows;
}

export async function getSiteParameters() {
  const result = await db.query(`SELECT * FROM site_parameters WHERE id = 1`);
  return result.rows[0] || null;
}

export async function getFilterCategories() {
  const result = await db.query(`
    SELECT fc.*,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
          ORDER BY f.name
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM filter_categories fc
    LEFT JOIN filters f ON fc.id = f.category_id
    GROUP BY fc.id
    ORDER BY fc.order_rank
  `);
  return result.rows;
}
```

**Effort:** 1 day

### 2.2 Update Page Components

Replace Sanity fetches in all pages:

| File | Change |
|------|--------|
| `src/app/(site)/page.tsx` | `client.fetch(GROQ)` → `getPageBySlug('home')` |
| `src/app/(site)/contact/page.tsx` | Same pattern |
| `src/app/(site)/over-ons/page.tsx` | Same pattern |
| `src/app/(site)/afspraak/page.tsx` | Same pattern |
| `src/app/(site)/realisaties/page.tsx` | `getAllSolutions()` + `getFilterCategories()` |
| `src/app/(site)/realisaties/[slug]/page.tsx` | `getSolutionBySlug(slug)` |
| `src/components/layout/Header.tsx` | `getNavigation('header')` |
| `src/components/layout/Footer.tsx` | `getNavigation('footer')` + `getSiteParameters()` |

**Effort:** 1 day

### 2.3 Update Image Handling

Replace Sanity's `urlFor()` with direct URLs.

**Current:**
```typescript
import { urlFor } from '@/sanity/imageUrl';
<img src={urlFor(image).width(800).url()} />
```

**New:**
```typescript
// Images now have direct URLs stored in the database
<img src={image.url} />

// If you need transforms (resize, crop), use Cloudinary URL transforms
// or a Next.js Image component with loader
<Image
  src={image.url}
  width={800}
  height={600}
  alt={image.alt || ''}
/>
```

**Effort:** Half day (mostly find-and-replace)

### 2.4 Update Section Components

The section data structure stays the same - just comes from Postgres instead of Sanity. `SectionRenderer` should work without changes.

Only difference: image references are now `{ url, alt }` instead of `{ asset: { _ref }, alt }`.

Update any component that uses `urlFor()`:
- `src/components/sections/Slideshow.tsx`
- `src/components/sections/PageHeader.tsx`
- `src/components/sections/SplitSection.tsx`
- `src/components/sections/FlexibleSection/blocks/ImageBlock.tsx`
- etc.

**Effort:** Half day

---

## Phase 3: Admin UI - Simple Editors

### 3.1 Admin Routes Structure

```
src/app/admin/
├── content/
│   ├── page.tsx                    # Content overview/dashboard
│   ├── pages/
│   │   ├── page.tsx                # Pages list
│   │   └── [id]/page.tsx           # Page editor
│   ├── solutions/
│   │   ├── page.tsx                # Solutions list
│   │   └── [id]/page.tsx           # Solution editor
│   ├── filters/
│   │   └── page.tsx                # Filters & categories (combined)
│   ├── navigation/
│   │   └── page.tsx                # Navigation editor
│   └── settings/
│       └── page.tsx                # Site parameters
```

### 3.2 Simple Editors First

**Filters & Categories** (`src/app/admin/content/filters/page.tsx`):
- Two-column layout: categories on left, filters on right
- Add/edit/delete categories
- Add/edit/delete filters within categories
- Drag to reorder categories

**Site Parameters** (`src/app/admin/content/settings/page.tsx`):
- Simple form: address, phone, email, social URLs
- Save button

**Effort:** 1-2 days

### 3.3 Navigation Editor

- List of nav links with drag-to-reorder
- Each link: title, slug, submenu heading
- Sub-items: pick from solutions (searchable dropdown)
- Separate tabs for header/footer nav

**Effort:** 1 day

---

## Phase 4: Admin UI - Content Editors

### 4.1 Reusable Field Components

```
src/components/admin/content/fields/
├── TextField.tsx          # Text input
├── TextAreaField.tsx      # Multi-line text
├── SlugField.tsx          # Auto-generates from title
├── ToggleField.tsx        # Boolean switch
├── SelectField.tsx        # Dropdown
├── ImageField.tsx         # Upload + preview
├── PortableTextField.tsx  # Rich text (@portabletext/editor)
└── ArrayField.tsx         # Add/remove/reorder items
```

**ImageField example:**
```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';

interface ImageFieldProps {
  value: { url: string; alt?: string } | null;
  onChange: (value: { url: string; alt?: string } | null) => void;
}

export function ImageField({ value, onChange }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/content/images/upload', {
      method: 'POST',
      body: formData,
    });

    const { url } = await res.json();
    onChange({ url, alt: '' });
    setUploading(false);
  };

  if (value?.url) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <Image src={value.url} alt={value.alt || ''} width={200} height={150} className="rounded" />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Input
          placeholder="Alt text"
          value={value.alt || ''}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
        />
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary">
      {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
      <span>{uploading ? 'Uploading...' : 'Upload image'}</span>
      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </label>
  );
}
```

**Effort:** 1-2 days for all field components

### 4.2 Pages List & Basic Editor

**List view:**
- Table: title, slug, last updated
- Search/filter
- Create new button
- Click to edit

**Editor (basic fields):**
- Title (text)
- Slug (auto-generate from title)
- Header image (ImageField)
- Save/delete buttons

**Effort:** 1 day

### 4.3 Solutions List & Basic Editor

Same as pages, plus:
- Subtitle field
- Filter picker (multi-select from existing filters)
- Order rank (drag in list or number input)

**Effort:** 1 day

---

## Phase 5: Section Builder

### 5.1 Section List Component

```typescript
'use client';

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

function SortableSection({ section, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section._key });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg mb-2">
      <div className="flex items-center gap-2 p-3 bg-muted/50">
        <button {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </button>
        <span className="font-medium">{getSectionLabel(section._type)}</span>
        <span className="text-muted-foreground text-sm">{getSectionSummary(section)}</span>
        <button onClick={() => onDelete(section._key)} className="ml-auto text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {expanded && (
        <div className="p-4 border-t">
          <SectionForm section={section} onChange={onEdit} />
        </div>
      )}
    </div>
  );
}
```

### 5.2 Section Type Selector

```typescript
const SECTION_TYPES = [
  { type: 'pageHeader', label: 'Page Header', icon: Heading },
  { type: 'slideshow', label: 'Slideshow', icon: Images },
  { type: 'splitSection', label: 'Split Section', icon: Columns },
  { type: 'uspSection', label: 'USPs', icon: Star },
  { type: 'solutionsScroller', label: 'Solutions Scroller', icon: ScrollText },
  { type: 'flexibleSection', label: 'Flexible Section', icon: LayoutGrid },
];

function AddSectionButton({ onAdd }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline"><Plus /> Add Section</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SECTION_TYPES.map(({ type, label, icon: Icon }) => (
          <DropdownMenuItem key={type} onClick={() => onAdd(type)}>
            <Icon className="h-4 w-4 mr-2" /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5.3 Section Forms

One form component per section type:

```
src/components/admin/content/sections/
├── PageHeaderForm.tsx
├── SlideshowForm.tsx
├── SplitSectionForm.tsx
├── UspSectionForm.tsx
├── SolutionsScrollerForm.tsx
└── FlexibleSectionForm.tsx
```

**Example - SolutionsScrollerForm (simplest):**
```typescript
export function SolutionsScrollerForm({ section, onChange }) {
  return (
    <div className="space-y-4">
      <TextField
        label="Heading"
        value={section.heading || ''}
        onChange={(heading) => onChange({ ...section, heading })}
      />
      <TextField
        label="Subtitle"
        value={section.subtitle || ''}
        onChange={(subtitle) => onChange({ ...section, subtitle })}
      />
    </div>
  );
}
```

**Example - PageHeaderForm (medium):**
```typescript
export function PageHeaderForm({ section, onChange }) {
  return (
    <div className="space-y-4">
      <TextField
        label="Title"
        value={section.title || ''}
        onChange={(title) => onChange({ ...section, title })}
      />
      <PortableTextField
        label="Subtitle"
        value={section.subtitle || []}
        onChange={(subtitle) => onChange({ ...section, subtitle })}
      />
      <ToggleField
        label="Show background"
        checked={section.background || false}
        onChange={(background) => onChange({ ...section, background })}
      />
      <ToggleField
        label="Show image"
        checked={section.showImage || false}
        onChange={(showImage) => onChange({ ...section, showImage })}
      />
      <ToggleField
        label="Show buttons"
        checked={section.showButtons || false}
        onChange={(showButtons) => onChange({ ...section, showButtons })}
      />
      {section.showButtons && (
        <ButtonArrayField
          value={section.buttons || []}
          onChange={(buttons) => onChange({ ...section, buttons })}
        />
      )}
    </div>
  );
}
```

**Effort:** 2-3 days for all section forms

### 5.4 FlexibleSection Block Editor

Same pattern - sortable list of blocks with per-block forms.

```
src/components/admin/content/blocks/
├── TextBlockForm.tsx      # heading, headingLevel, content (PT), button
├── ImageBlockForm.tsx     # image picker
├── MapBlockForm.tsx       # no fields
└── FormBlockForm.tsx      # title, subtitle
```

**Effort:** 1 day

---

## Phase 6: Polish & Cleanup

### 6.1 Remove Sanity Dependencies

```bash
pnpm remove @sanity/client @sanity/image-url next-sanity
```

Delete:
- `src/sanity/` directory
- Any remaining GROQ queries
- Sanity types that are no longer needed

### 6.2 Update Types

```typescript
// src/types/content.ts
export interface Page {
  id: string;
  title: string;
  slug: string;
  header_image: ImageData | null;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

export interface Solution {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: ImageData | null;
  sections: Section[];
  filters: Filter[];
  order_rank: number;
}

export interface ImageData {
  url: string;
  alt?: string;
}

// Section types stay similar, just with ImageData instead of SanityImage
```

### 6.3 Error Handling & Loading States

- Add loading skeletons to lists
- Toast notifications for save/delete
- Validation before save
- Confirm dialogs for delete

### 6.4 Add to Sidebar

Update `AdminSidebar.tsx` to include content section:

```typescript
{
  title: 'Content',
  items: [
    { title: 'Pages', href: '/admin/content/pages', icon: FileText },
    { title: 'Realisaties', href: '/admin/content/solutions', icon: Images },
    { title: 'Filters', href: '/admin/content/filters', icon: Filter },
    { title: 'Navigatie', href: '/admin/content/navigation', icon: Navigation },
    { title: 'Instellingen', href: '/admin/content/settings', icon: Settings },
  ],
}
```

**Effort:** 1 day

---

## Summary

### Total Effort by Phase

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Foundation (DB, storage, base API) | 2-3 days |
| 2 | Frontend data layer (replace Sanity) | 2-3 days |
| 3 | Simple editors (filters, nav, params) | 2-3 days |
| 4 | Content editors (pages, solutions basic) | 2-3 days |
| 5 | Section builder | 3-4 days |
| 6 | Polish & cleanup | 1-2 days |

**Total: 12-18 days of focused work (~3 weeks)**

### Dependencies to Add

```bash
pnpm add @vercel/blob  # or cloudinary
pnpm add @portabletext/editor
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Dependencies to Remove (after migration)

```bash
pnpm remove @sanity/client @sanity/image-url next-sanity
```

### What You Get

- ✅ Full control over your content
- ✅ No external CMS dependency
- ✅ Single admin panel for everything
- ✅ Content stored in your database
- ✅ Custom UI matching your admin style
- ✅ No Sanity subscription costs

### Recommended Order

1. **Phase 1** - Get database and storage working
2. **Phase 2** - Update frontend to use new data layer (site keeps working)
3. **Phase 3** - Build simple editors (start using them immediately)
4. **Phase 4** - Build content list views and basic editors
5. **Phase 5** - Add section builder
6. **Phase 6** - Clean up, remove Sanity

You can start manually adding content via the admin as soon as Phase 3 is done for simple content, and Phase 5 for pages/solutions.
