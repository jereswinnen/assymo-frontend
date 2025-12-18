# Content Management System - Build Plan

## Progress Checklist

- [x] Phase 1: Database Schema
- [x] Phase 2: Image Storage Setup
- [x] Phase 3: Content Data Layer
- [x] Phase 4: Admin Sidebar Update
- [x] Phase 5: Site Parameters Editor
- [x] Phase 6: Filter Categories Editor
- [x] Phase 7: Navigation Editor
- [x] Phase 8: Pages List View
- [x] Phase 9: Page Editor (Basic Fields)
- [x] Phase 10: Media Browser
- [ ] Phase 11: Solutions List & Basic Editor
- [ ] Phase 12: Section Builder Core
- [ ] Phase 13: Simple Section Forms
- [ ] Phase 14: Complex Section Forms
- [ ] Phase 15: Rich Text Editor
- [ ] Phase 16: FlexibleSection Form
- [ ] Phase 17: Update Frontend Pages
- [ ] Phase 18: Update Image References
- [ ] Phase 19: Cleanup

---

## Overview

Replace Sanity entirely with a custom CMS built into the admin panel. Content stored in Neon Postgres, images via cloud storage.

**Complexity:** 🟢 Very doable

**Total estimate:** ~3 weeks of focused work, broken into small phases

---

## Existing Assets We'll Use

You already have these shadcn components - no need to create field wrappers:

| Component | Use For |
|-----------|---------|
| `Input` | Text fields, slugs |
| `Textarea` | Multi-line text |
| `Switch` | Boolean toggles |
| `Select` | Dropdowns, layout pickers |
| `Button` | Actions |
| `Dialog` | Modals for editing |
| `DropdownMenu` | Section type picker |
| `Card` | List items, section cards |
| `Badge` | Status indicators |
| `Separator` | Form sections |
| `Label` | Field labels |

Plus existing patterns from appointments/newsletters for CRUD operations.

---

## Phase 1: Database Schema
- [x] Complete

**Time: 2-3 hours**

Run this SQL in Neon:

```sql
-- Pages
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  header_image JSONB,
  sections JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solutions (Realisaties)
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

-- Filter categories
CREATE TABLE filter_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  order_rank INTEGER DEFAULT 0
);

-- Filters
CREATE TABLE filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id UUID REFERENCES filter_categories(id) ON DELETE CASCADE,
  UNIQUE(slug, category_id)
);

-- Solution <-> Filter junction
CREATE TABLE solution_filters (
  solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
  filter_id UUID REFERENCES filters(id) ON DELETE CASCADE,
  PRIMARY KEY (solution_id, filter_id)
);

-- Navigation links
CREATE TABLE navigation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL, -- 'header' or 'footer'
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  submenu_heading TEXT,
  order_rank INTEGER DEFAULT 0
);

-- Navigation sub-items
CREATE TABLE navigation_subitems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES navigation_links(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL,
  order_rank INTEGER DEFAULT 0
);

-- Site parameters (singleton)
CREATE TABLE site_parameters (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  address TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  vat_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_solutions_slug ON solutions(slug);
CREATE INDEX idx_solutions_order ON solutions(order_rank);
CREATE INDEX idx_filters_category ON filters(category_id);
CREATE INDEX idx_nav_links_location ON navigation_links(location);
```

**Deliverable:** Tables created in Neon

---

## Phase 2: Image Storage Setup
- [x] Complete

**Time: 1-2 hours**

Install Vercel Blob:
```bash
pnpm add @vercel/blob
```

Create storage helper:

```typescript
// src/lib/storage.ts
import { put, del } from '@vercel/blob';

export async function uploadImage(file: File) {
  const blob = await put(file.name, file, { access: 'public' });
  return { url: blob.url, filename: file.name };
}

export async function deleteImage(url: string) {
  await del(url);
}
```

Create upload API route:

```typescript
// src/app/api/admin/content/images/upload/route.ts
import { isAuthenticated } from '@/lib/auth-utils';
import { uploadImage } from '@/lib/storage';

export async function POST(req: Request) {
  if (!await isAuthenticated()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const result = await uploadImage(file);
  return Response.json(result);
}
```

Add `BLOB_READ_WRITE_TOKEN` to env vars (from Vercel dashboard).

**Deliverable:** Image upload working

---

## Phase 3: Content Data Layer
- [x] Complete

**Time: 3-4 hours**

Create functions to fetch content from Postgres:

```typescript
// src/lib/content.ts
import { db } from './db';

export async function getPageBySlug(slug: string) {
  const result = await db.query(
    'SELECT * FROM pages WHERE slug = $1',
    [slug]
  );
  return result.rows[0] || null;
}

export async function getAllPages() {
  const result = await db.query(
    'SELECT id, title, slug, updated_at FROM pages ORDER BY title'
  );
  return result.rows;
}

export async function getSolutionBySlug(slug: string) {
  const result = await db.query(`
    SELECT s.*,
      COALESCE(json_agg(
        json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
      ) FILTER (WHERE f.id IS NOT NULL), '[]') as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    WHERE s.slug = $1
    GROUP BY s.id
  `, [slug]);
  return result.rows[0] || null;
}

export async function getAllSolutions() {
  const result = await db.query(`
    SELECT s.*,
      COALESCE(json_agg(
        json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
      ) FILTER (WHERE f.id IS NOT NULL), '[]') as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    GROUP BY s.id
    ORDER BY s.order_rank
  `);
  return result.rows;
}

export async function getFilterCategories() {
  const result = await db.query(`
    SELECT fc.*,
      COALESCE(json_agg(
        json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
        ORDER BY f.name
      ) FILTER (WHERE f.id IS NOT NULL), '[]') as filters
    FROM filter_categories fc
    LEFT JOIN filters f ON fc.id = f.category_id
    GROUP BY fc.id
    ORDER BY fc.order_rank
  `);
  return result.rows;
}

export async function getNavigation(location: 'header' | 'footer') {
  const result = await db.query(`
    SELECT nl.*,
      COALESCE(json_agg(
        json_build_object(
          'id', ns.id,
          'solution', json_build_object('name', s.name, 'slug', s.slug, 'header_image', s.header_image)
        ) ORDER BY ns.order_rank
      ) FILTER (WHERE ns.id IS NOT NULL), '[]') as sub_items
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
  const result = await db.query('SELECT * FROM site_parameters WHERE id = 1');
  return result.rows[0] || null;
}
```

**Deliverable:** All read functions ready

---

## Phase 4: Admin Sidebar Update
- [x] Complete

**Time: 30 minutes**

Add content section to AdminSidebar:

```typescript
const contentItems = [
  { href: '/admin/content/pages', label: "Pagina's", icon: FileTextIcon },
  { href: '/admin/content/solutions', label: 'Realisaties', icon: ImageIcon },
  { href: '/admin/content/media', label: 'Media', icon: FolderOpenIcon },
  { href: '/admin/content/filters', label: 'Filters', icon: FilterIcon },
  { href: '/admin/content/navigation', label: 'Navigatie', icon: MenuIcon },
  { href: '/admin/content/parameters', label: 'Parameters', icon: ChevronsLeftRightEllipsisIcon },
];
```

**Deliverable:** Content accessible from sidebar

---

## Phase 5: Site Parameters Editor
- [x] Complete

**Time: 2-3 hours**

API route:
```typescript
// src/app/api/admin/content/site-parameters/route.ts
export async function GET() {
  const params = await getSiteParameters();
  return Response.json(params);
}

export async function PUT(req: Request) {
  if (!await isAuthenticated()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  await db.query(`
    INSERT INTO site_parameters (id, address, phone, email, instagram, facebook, vat_number)
    VALUES (1, $1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      address = $1, phone = $2, email = $3, instagram = $4, facebook = $5, vat_number = $6,
      updated_at = NOW()
  `, [data.address, data.phone, data.email, data.instagram, data.facebook, data.vat_number]);
  return Response.json({ success: true });
}
```

Admin page (using existing shadcn components):
```typescript
// src/app/admin/content/parameters/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SiteSettingsPage() {
  const [params, setParams] = useState({ address: '', phone: '', email: '', instagram: '', facebook: '', vat_number: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/content/site-parameters').then(r => r.json()).then(setParams);
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/content/site-parameters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    toast.success('Instellingen opgeslagen');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Site Instellingen</h1>

      <div className="space-y-4">
        <div>
          <Label>Adres</Label>
          <Input value={params.address} onChange={e => setParams({...params, address: e.target.value})} />
        </div>
        <div>
          <Label>Telefoon</Label>
          <Input value={params.phone} onChange={e => setParams({...params, phone: e.target.value})} />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input value={params.email} onChange={e => setParams({...params, email: e.target.value})} />
        </div>
        <div>
          <Label>Instagram URL</Label>
          <Input value={params.instagram} onChange={e => setParams({...params, instagram: e.target.value})} />
        </div>
        <div>
          <Label>Facebook URL</Label>
          <Input value={params.facebook} onChange={e => setParams({...params, facebook: e.target.value})} />
        </div>
        <div>
          <Label>BTW Nummer</Label>
          <Input value={params.vat_number} onChange={e => setParams({...params, vat_number: e.target.value})} />
        </div>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? 'Opslaan...' : 'Opslaan'}
      </Button>
    </div>
  );
}
```

**Deliverable:** Site parameters editable in admin

---

## Phase 6: Filter Categories Editor
- [x] Complete

**Time: 3-4 hours**

API routes for CRUD on filter_categories and filters.

**Installed dnd-kit** for drag-to-reorder (used in Phase 7 and 12 as well):
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Admin page with:
- List of categories (left side)
- Filters within selected category (right side)
- Add/edit/delete for both
- Drag to reorder categories and filters

Use existing shadcn: `Card`, `Button`, `Input`, `Dialog`, `AlertDialog`

**Deliverable:** Filters fully manageable

---

## Phase 7: Navigation Editor
- [x] Complete

**Time: 3-4 hours**

API routes for navigation_links and navigation_subitems.

Admin page with:
- Tabs for "Header" and "Footer"
- List of links with drag-to-reorder
- Each link expandable to edit title, slug, submenu heading
- Sub-items: select from solutions (use `Select` component)

**Deliverable:** Navigation editable in admin

---

## Phase 8: Pages List View
- [x] Complete

**Time: 2-3 hours**

API route:
```typescript
// src/app/api/admin/content/pages/route.ts
export async function GET() { /* list all pages */ }
export async function POST(req) { /* create page */ }

// src/app/api/admin/content/pages/[id]/route.ts
export async function GET(req, { params }) { /* get single page */ }
export async function PUT(req, { params }) { /* update page */ }
export async function DELETE(req, { params }) { /* delete page */ }
```

Admin page:
- Table with title, slug, updated date
- "Nieuwe pagina" button
- Click row to edit

**Deliverable:** Pages list in admin

---

## Phase 9: Page Editor (Basic Fields)
- [x] Complete

**Time: 2-3 hours**

Page at `/admin/content/pages/[id]/page.tsx`:
- Title input
- Slug input (auto-generate from title)
- Header image upload
- Save/Delete buttons

Image upload component (reusable):
```typescript
// src/components/admin/ImageUpload.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: { url: string; alt?: string } | null;
  onChange: (value: { url: string; alt?: string } | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/content/images/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    onChange({ url, alt: '' });
    setUploading(false);
  };

  if (value?.url) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <Image src={value.url} alt={value.alt || ''} width={300} height={200} className="rounded border" />
          <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <Label>Alt tekst</Label>
          <Input value={value.alt || ''} onChange={e => onChange({ ...value, alt: e.target.value })} placeholder="Beschrijving van de afbeelding" />
        </div>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-8 hover:border-primary transition-colors">
      {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
      <span className="text-sm text-muted-foreground">{uploading ? 'Uploaden...' : 'Klik om afbeelding te uploaden'}</span>
      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
    </label>
  );
}
```

**Deliverable:** Pages editable (basic fields)

---

## Phase 10: Media Browser
- [x] Complete

**Time: 2-3 hours**

API route to list all blobs:
```typescript
// src/app/api/admin/content/media/route.ts
import { list } from '@vercel/blob';
import { isAuthenticated } from '@/lib/auth-utils';

export async function GET() {
  if (!await isAuthenticated()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { blobs } = await list();
  return Response.json(blobs);
}
```

Admin page at `/admin/content/media/page.tsx`:
- Grid view of all uploaded images with thumbnails
- Click to copy URL to clipboard
- Delete button on each image
- Upload new image button
- Search/filter by filename

Use existing shadcn: `Card`, `Button`, `Dialog` (for delete confirmation)

**Deliverable:** Browse, upload, and delete media files

---

## Phase 11: Solutions List & Basic Editor
- [ ] Complete

**Time: 2-3 hours**

Same pattern as pages, plus:
- Subtitle field
- Order rank (number input or drag in list)
- Filter picker (multi-select checkboxes)

**Deliverable:** Solutions list and basic editing

---

## Phase 12: Section Builder Core
- [ ] Complete

**Time: 3-4 hours**

dnd-kit is already installed (added in Phase 6).

Create sortable section list component:

```typescript
// src/components/admin/SectionList.tsx
'use client';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

function SortableSection({ section, onUpdate, onDelete, children }) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section._key });

  return (
    <Card ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="mb-2">
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab"><GripVertical className="h-4 w-4" /></button>
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="font-medium flex-1">{getSectionLabel(section._type)}</span>
        <Button size="icon" variant="ghost" onClick={() => onDelete(section._key)}><Trash2 className="h-4 w-4" /></Button>
      </div>
      {expanded && <div className="p-4 border-t">{children}</div>}
    </Card>
  );
}

export function SectionList({ sections, onChange }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s._key === active.id);
      const newIndex = sections.findIndex(s => s._key === over.id);
      onChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map(s => s._key)} strategy={verticalListSortingStrategy}>
        {sections.map(section => (
          <SortableSection key={section._key} section={section} onDelete={...} onUpdate={...}>
            <SectionForm section={section} onChange={...} />
          </SortableSection>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

Add section button with dropdown:
```typescript
// src/components/admin/AddSectionButton.tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const SECTION_TYPES = [
  { type: 'pageHeader', label: 'Page Header' },
  { type: 'slideshow', label: 'Slideshow' },
  { type: 'splitSection', label: 'Split Section' },
  { type: 'uspSection', label: 'USPs' },
  { type: 'solutionsScroller', label: 'Solutions Scroller' },
  { type: 'flexibleSection', label: 'Flexible Section' },
];

export function AddSectionButton({ onAdd }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Sectie toevoegen</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SECTION_TYPES.map(({ type, label }) => (
          <DropdownMenuItem key={type} onClick={() => onAdd(type)}>{label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Deliverable:** Sections can be added, reordered, deleted

---

## Phase 13: Simple Section Forms
- [ ] Complete

**Time: 2-3 hours**

Forms for the simpler sections:

**SolutionsScrollerForm:**
```typescript
export function SolutionsScrollerForm({ section, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Heading</Label>
        <Input value={section.heading || ''} onChange={e => onChange({ ...section, heading: e.target.value })} />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input value={section.subtitle || ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} />
      </div>
    </div>
  );
}
```

**UspSectionForm:**
- Heading input
- Array of USPs (each: icon select, title, text, link)
- Add/remove USP buttons

**SlideshowForm:**
- Background toggle (Switch)
- Images array (each: ImageUpload + caption input)
- Add/remove/reorder images

**Deliverable:** 3 section types editable

---

## Phase 14: Complex Section Forms
- [ ] Complete

**Time: 3-4 hours**

**PageHeaderForm:**
- Title input
- Subtitle (rich text - see Phase 15)
- Background toggle
- Show image toggle
- Show buttons toggle
- Buttons array (if enabled): label, url, icon select, variant select

**SplitSectionForm:**
- 2 items, each with: ImageUpload, title, subtitle, href, action config

**Deliverable:** 5 of 6 section types editable

---

## Phase 15: Rich Text Editor
- [ ] Complete

**Time: 2-3 hours**

Install:
```bash
pnpm add @portabletext/editor
```

Create wrapper:
```typescript
// src/components/admin/RichTextEditor.tsx
'use client';
import { PortableTextEditor } from '@portabletext/editor';
import { Label } from '@/components/ui/label';

export function RichTextEditor({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="border rounded-md p-2 min-h-[100px]">
        <PortableTextEditor value={value || []} onChange={onChange} />
      </div>
    </div>
  );
}
```

Use in PageHeaderForm for subtitle, and FlexibleSection text blocks.

**Deliverable:** Rich text editing works

---

## Phase 16: FlexibleSection Form
- [ ] Complete

**Time: 3-4 hours**

The most complex section:
- Layout selector (Select: 1-col, 2-col-equal, 2-col-left-wide, 2-col-right-wide)
- Background toggle
- Vertical align selector
- Block arrays (based on layout):
  - 1-col: blockMain
  - 2-col: blockLeft + blockRight

Block forms:
- **flexTextBlock**: heading, headingLevel select, RichTextEditor, button config
- **flexImageBlock**: ImageUpload
- **flexMapBlock**: no fields needed
- **flexFormBlock**: title, subtitle

**Deliverable:** All 6 section types editable

---

## Phase 17: Update Frontend Pages
- [ ] Complete

**Time: 2-3 hours**

Replace Sanity fetches with new data layer:

| File | Change |
|------|--------|
| `src/app/(site)/page.tsx` | `getPageBySlug('home')` |
| `src/app/(site)/contact/page.tsx` | `getPageBySlug('contact')` |
| `src/app/(site)/over-ons/page.tsx` | `getPageBySlug('over-ons')` |
| `src/app/(site)/afspraak/page.tsx` | `getPageBySlug('afspraak')` |
| `src/app/(site)/realisaties/page.tsx` | `getAllSolutions()` + `getFilterCategories()` |
| `src/app/(site)/realisaties/[slug]/page.tsx` | `getSolutionBySlug(slug)` |
| `src/components/layout/Header.tsx` | `getNavigation('header')` |
| `src/components/layout/Footer.tsx` | `getNavigation('footer')` + `getSiteParameters()` |

**Deliverable:** Site reads from Postgres

---

## Phase 18: Update Image References
- [ ] Complete

**Time: 1-2 hours**

Replace `urlFor(image)` with direct URLs in all components:

**Before:**
```tsx
import { urlFor } from '@/sanity/imageUrl';
<img src={urlFor(image).width(800).url()} />
```

**After:**
```tsx
<Image src={image.url} width={800} height={600} alt={image.alt || ''} />
```

Files to update:
- `src/components/sections/Slideshow.tsx`
- `src/components/sections/PageHeader.tsx`
- `src/components/sections/SplitSection.tsx`
- `src/components/sections/SolutionsScrollerClient.tsx`
- `src/components/sections/FlexibleSection/blocks/ImageBlock.tsx`

**Deliverable:** All images use direct URLs

---

## Phase 19: Cleanup
- [ ] Complete

**Time: 1-2 hours**

Remove Sanity:
```bash
pnpm remove @sanity/client @sanity/image-url next-sanity
```

Delete:
- `src/sanity/` directory
- `src/sanity/fragments.ts`
- Sanity-specific types

Update remaining references.

**Deliverable:** Sanity fully removed

---

## Summary

### Phases Overview

| # | Phase | Time |
|---|-------|------|
| 1 | Database schema | 2-3h |
| 2 | Image storage | 1-2h |
| 3 | Content data layer | 3-4h |
| 4 | Admin sidebar update | 30m |
| 5 | Site parameters editor | 2-3h |
| 6 | Filter categories editor | 3-4h |
| 7 | Navigation editor | 3-4h |
| 8 | Pages list view | 2-3h |
| 9 | Page editor (basic) | 2-3h |
| 10 | Media browser | 2-3h |
| 11 | Solutions list & editor | 2-3h |
| 12 | Section builder core | 3-4h |
| 13 | Simple section forms | 2-3h |
| 14 | Complex section forms | 3-4h |
| 15 | Rich text editor | 2-3h |
| 16 | FlexibleSection form | 3-4h |
| 17 | Update frontend pages | 2-3h |
| 18 | Update image references | 1-2h |
| 19 | Cleanup | 1-2h |

**Total: ~45-60 hours (~3 weeks)**

### Dependencies

```bash
# Already installed:
# - @vercel/blob (Phase 2)
# - @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities (Phase 6)

# Still to add:
pnpm add @portabletext/editor

# Remove (Phase 19)
pnpm remove @sanity/client @sanity/image-url next-sanity
```

### What You're Reusing

- All shadcn components (Input, Button, Select, Switch, Dialog, Card, etc.)
- Existing admin layout and sidebar
- Existing auth (isAuthenticated)
- Existing toast notifications (sonner)
- Existing CRUD patterns from appointments/newsletters
- Existing db.ts for Postgres queries

### Milestones

After completing these phases, you can start using the feature:

| After Phase | What Works |
|-------------|------------|
| 4 | Content section visible in admin sidebar |
| 5 | Site parameters editable |
| 7 | Filters + navigation editable |
| 10 | Media browser for uploaded images |
| 11 | Pages + solutions basic editing |
| 16 | Full page/section editing |
| 18 | Site runs on Postgres (frontend switched) |
| 19 | Sanity fully removed |
