# Sanity Admin Studio Analysis

## Executive Summary

Building a custom content studio within the admin panel is **very doable**. The key insight is that we're not building anything from scratch:

- **Portable Text** → `@portabletext/editor` handles this natively
- **Drag-and-drop** → `@dnd-kit/core` is straightforward
- **Image uploads** → Sanity's asset API is simple
- **API layer** → You already have CRUD patterns from appointments/newsletters

The work is essentially: **install packages, build forms, wire up APIs**.

**Estimated complexity**: 🟢 Medium

---

## What You Already Have

Your existing admin panel provides 80% of the infrastructure:

| Component | Status |
|-----------|--------|
| Authentication (Better Auth + 2FA) | ✅ Done |
| Admin layout & sidebar | ✅ Done |
| API route patterns | ✅ Done |
| CRUD patterns | ✅ Done (appointments, newsletters) |
| UI components (Radix) | ✅ Done |
| Form patterns | ✅ Done |
| Loading/error states | ✅ Done |
| Toast notifications | ✅ Done |

---

## Content Types Overview

| Type | Fields | Effort |
|------|--------|--------|
| `filter` | name, slug | Trivial |
| `filterCategory` | name, slug, orderRank | Trivial |
| `filterOption` | name, slug | Trivial |
| `siteParameters` | address, phone, email, socials | Easy |
| `navigation` | links array with nested items | Easy |
| `page` | title, slug, headerImage, sections[] | Medium |
| `solution` | name, slug, headerImage, filters[], sections[] | Medium |

---

## Key Dependencies

```bash
pnpm add @portabletext/editor @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

That's it. These packages do the heavy lifting.

---

## Implementation Breakdown

### 1. Sanity Write Client (30 minutes)

```typescript
// src/sanity/client.ts
export const writeClient = createClient({
  projectId: "naj44gzh",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});
```

Add `SANITY_WRITE_TOKEN` to your environment variables.

### 2. Simple Content Editors (1-2 days)

These are just forms. You've built these before.

**Filters & Categories:**
```tsx
// Literally just:
<Input label="Name" value={name} onChange={setName} />
<Input label="Slug" value={slug} onChange={setSlug} />
<Button onClick={save}>Save</Button>
```

**Site Parameters:**
```tsx
<Input label="Address" />
<Input label="Phone" />
<Input label="Email" />
<Input label="Instagram URL" />
<Input label="Facebook URL" />
```

### 3. Portable Text Editor (1 day)

Using `@portabletext/editor`:

```tsx
import { PortableTextEditor } from '@portabletext/editor';

function RichTextField({ value, onChange }) {
  return (
    <PortableTextEditor
      value={value}
      onChange={onChange}
      // Configure which marks/blocks you need
    />
  );
}
```

The package handles:
- Bold, italic, underline
- Headings (h1-h4)
- Links
- Block quotes
- Lists

No custom serialization needed - it outputs Portable Text natively.

### 4. Image Field (1 day)

```tsx
function ImageField({ value, onChange }) {
  const handleUpload = async (file: File) => {
    const asset = await writeClient.assets.upload('image', file);
    onChange({
      asset: { _ref: asset._id },
      alt: '',
    });
  };

  return (
    <div>
      {value?.asset && <img src={urlFor(value).url()} />}
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      <Input label="Alt text" value={value?.alt} onChange={...} />
    </div>
  );
}
```

For hotspot editing, you can add a simple click handler on the image preview, or skip it initially (most images don't need hotspots).

### 5. Section Builder (2-3 days)

The "complex" part is really just:

**A. Sortable list with dnd-kit:**
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function SectionList({ sections, onReorder }) {
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={sections} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableSection key={section._key} section={section} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**B. Section type selector:**
```tsx
const sectionTypes = [
  { type: 'pageHeader', label: 'Page Header' },
  { type: 'slideshow', label: 'Slideshow' },
  { type: 'splitSection', label: 'Split Section' },
  { type: 'uspSection', label: 'USPs' },
  { type: 'solutionsScroller', label: 'Solutions Scroller' },
  { type: 'flexibleSection', label: 'Flexible Section' },
];

<Select options={sectionTypes} onSelect={addSection} />
```

**C. Section forms (one per type):**
Each is just a form with the relevant fields:

| Section | Form Fields |
|---------|-------------|
| `pageHeader` | title, subtitle (PT), background toggle, showImage toggle, buttons array |
| `slideshow` | images array (with ImageField + caption) |
| `splitSection` | 2 items, each with image, title, subtitle, href |
| `uspSection` | heading, usps array (icon, title, text, link) |
| `solutionsScroller` | heading, subtitle |
| `flexibleSection` | layout select, block arrays |

These are forms. Tedious to build, but not complex.

### 6. FlexibleSection Block Editor (1 day)

Same pattern as sections - sortable list + type selector + per-block forms.

Block forms are even simpler:
- `flexTextBlock`: heading, headingLevel select, PT editor, button config
- `flexImageBlock`: ImageField
- `flexMapBlock`: no fields (just renders map)
- `flexFormBlock`: title, subtitle

### 7. API Routes (1 day)

Copy the pattern from your existing admin routes:

```typescript
// /api/admin/content/pages/route.ts
export async function GET() {
  const pages = await client.fetch(`*[_type == "page"]`);
  return Response.json(pages);
}

export async function POST(req: Request) {
  const data = await req.json();
  const result = await writeClient.create({ _type: 'page', ...data });
  return Response.json(result);
}

// /api/admin/content/pages/[id]/route.ts
export async function PUT(req: Request, { params }) {
  const data = await req.json();
  const result = await writeClient.patch(params.id).set(data).commit();
  return Response.json(result);
}

export async function DELETE(req: Request, { params }) {
  await writeClient.delete(params.id);
  return Response.json({ success: true });
}
```

---

## Realistic Timeline

| Phase | Work | Time |
|-------|------|------|
| Setup | Write client, dependencies, routes | 1 day |
| Simple editors | filters, categories, site params | 1-2 days |
| Rich text | @portabletext/editor integration | 1 day |
| Images | Upload, preview, alt text | 1 day |
| Section builder | Sortable list, type selector | 1 day |
| Section forms | 6 form components | 2 days |
| Block forms | 4 form components | 1 day |
| Navigation editor | Nested links, references | 1 day |
| Polish | Error handling, validation, UX | 1-2 days |

**Total: 10-12 days of focused work**

This is assuming you're building it yourself and are familiar with the codebase (which you are).

---

## Component Structure

```
src/components/admin/content/
├── fields/
│   ├── TextField.tsx           # Already have Input
│   ├── SlugField.tsx           # Auto-generate from title
│   ├── ToggleField.tsx         # Already have Switch
│   ├── SelectField.tsx         # Already have Select
│   ├── ImageField.tsx          # Upload + preview + alt
│   ├── PortableTextField.tsx   # @portabletext/editor wrapper
│   ├── ArrayField.tsx          # Generic add/remove/reorder
│   └── ReferenceField.tsx      # Searchable dropdown
├── editors/
│   ├── FilterEditor.tsx
│   ├── SiteParamsEditor.tsx
│   ├── NavigationEditor.tsx
│   ├── PageEditor.tsx
│   └── SolutionEditor.tsx
└── sections/
    ├── SectionList.tsx         # Sortable container
    ├── SectionPalette.tsx      # Type selector
    └── forms/
        ├── PageHeaderForm.tsx
        ├── SlideshowForm.tsx
        ├── SplitSectionForm.tsx
        ├── UspSectionForm.tsx
        ├── SolutionsScrollerForm.tsx
        └── FlexibleSectionForm.tsx
```

**~20 components total**, most of which are simple forms.

---

## What You Can Skip (Initially)

1. **Hotspot editor** - Most images don't need it. Add later if needed.
2. **Live preview** - Just save and check the live site. Add preview later.
3. **Draft/publish workflow** - Edit published documents directly. Simpler.
4. **Concurrent edit detection** - You're likely the only editor.
5. **Revision history** - Sanity keeps this automatically.
6. **Undo/redo** - Nice to have, not essential.

---

## Recommended Order

1. **Start with filters/categories** - Simplest, builds confidence
2. **Add site parameters** - Still simple, immediately useful
3. **Add image field** - You'll need it for everything else
4. **Add PT editor** - Wrap the package, test it works
5. **Build page list + basic editor** - Title, slug, headerImage
6. **Add section builder** - The fun part
7. **Add section forms one by one** - Start with simplest (solutionsScroller)
8. **Solutions editor** - Same as pages + filter picker
9. **Navigation editor** - If needed

---

## Conclusion

You were right - this isn't that difficult. The perceived complexity in my original analysis came from:

1. **Overestimating PT complexity** - `@portabletext/editor` handles it
2. **Overestimating drag-drop** - `@dnd-kit` makes it easy
3. **Not crediting existing patterns** - You've already built CRUD admins

The actual work is:
- **70% building forms** (tedious, not hard)
- **20% wiring up APIs** (you have patterns)
- **10% package integration** (install and configure)

**Estimated total: 2-3 weeks of focused work** to have a fully functional content studio.
