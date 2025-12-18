# Sanity Admin Studio Analysis

## Executive Summary

Building a custom content studio within the admin panel to replace/supplement Sanity Studio is a **moderate-to-significant undertaking**. While the existing admin architecture provides a solid foundation, the complexity lies primarily in:

1. **Portable Text editing** (rich text) - requires implementing a full WYSIWYG editor
2. **Image management** - needs upload/crop/hotspot functionality
3. **Page section builder** - drag-and-drop interface for composing pages
4. **Sanity API integration** - mutations, references, and asset uploads

**Estimated complexity**: 🟡 Medium-High

---

## Current Architecture Overview

### Content Types in Sanity

| Type | Purpose | Complexity to Edit |
|------|---------|-------------------|
| `page` | Site pages (home, contact, etc.) | High - has sections array |
| `solution` | "Realisaties" (realizations/projects) | High - sections + filters |
| `filter` | Solution filter tags | Low - simple fields |
| `filterCategory` | Groups of filters | Low - simple fields |
| `filterOption` | Filter option values | Low - simple fields |
| `navigation` | Header/footer nav | Medium - nested links |
| `siteParameters` | Global settings | Low - simple fields |

### Section Types (for page builder)

| Section Type | Fields | Complexity |
|--------------|--------|------------|
| `pageHeader` | title, subtitle (PT), buttons | Medium |
| `slideshow` | images array with captions | Medium |
| `splitSection` | 2 items with images, titles | Medium |
| `uspSection` | heading, USPs array | Medium |
| `solutionsScroller` | heading, subtitle | Low |
| `flexibleSection` | layout, 3 block arrays | High |

### FlexibleSection Block Types

| Block Type | Fields | Complexity |
|------------|--------|------------|
| `flexTextBlock` | heading, content (PT), button | Medium |
| `flexImageBlock` | image | Low |
| `flexMapBlock` | none | Low |
| `flexFormBlock` | title, subtitle | Low |

---

## What Needs to Be Built

### 1. Core Admin Infrastructure

**Already exists:**
- Authentication (Better Auth with 2FA/passkeys)
- Admin layout with sidebar
- API route patterns
- CRUD patterns (appointments, newsletters)
- UI component library (Radix UI)

**Needs to be added:**
- Sanity mutation API integration
- Image upload service
- Content type registry
- Form generation system

### 2. Content Editors by Type

#### Simple Content Types (Low effort)
- **filter** - name, slug
- **filterCategory** - name, slug, orderRank
- **filterOption** - name, slug
- **siteParameters** - address, phone, email, social URLs

These are straightforward forms with text inputs.

#### Medium Content Types
- **navigation** - requires nested item management, references to solutions

#### Complex Content Types (High effort)
- **page** - requires full section builder
- **solution** - requires section builder + filter picker

### 3. Rich Text Editor (Portable Text)

**The Challenge:**
Sanity uses Portable Text, a JSON-based rich text format. You'll need a WYSIWYG editor that outputs this format.

**Options:**
1. **Sanity UI + Portable Text Editor** - Sanity's own editor as a standalone package
   - Pros: Native PT output, feature-complete
   - Cons: Requires Sanity dependencies

2. **TipTap/ProseMirror** - Popular rich text framework
   - Pros: Highly customizable, great React support
   - Cons: Requires custom PT serialization

3. **Plate** - Pluggable rich text editor built on Slate
   - Pros: Modern, composable
   - Cons: Complex setup

**Recommendation:** TipTap with custom Portable Text serializer

**Estimated effort:** 3-5 days for basic implementation

### 4. Image Management

**Requirements:**
- Upload images to Sanity's asset pipeline
- Crop/hotspot selection
- Alt text editing
- Image library browser

**Sanity Upload API:**
```typescript
// Upload requires Sanity client with write token
const asset = await client.assets.upload('image', file, {
  filename: file.name
});
// Returns: { _id: 'image-xxx', url: '...' }
```

**Hotspot/Crop UI:**
Need to build an image editor with:
- Click-to-place hotspot
- Crop rectangle drawing
- Preview at different aspect ratios

**Estimated effort:** 2-3 days

### 5. Page Section Builder

**The Challenge:**
The current SectionRenderer supports 6 section types, each with different field structures. A visual builder needs:

1. **Section palette** - list of available section types
2. **Section list** - current sections with reorder
3. **Section editor** - form for each section type
4. **Preview** - live preview of the page

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  Page Editor                                            │
├──────────────┬─────────────────────┬───────────────────┤
│  Section     │  Section Editor     │  Live Preview     │
│  Palette     │  (form for active   │  (iframe or       │
│              │   section)          │   component)      │
│  + Header    │                     │                   │
│  + Slideshow │  ┌───────────────┐  │  ┌─────────────┐  │
│  + Split     │  │ Title: [____] │  │  │             │  │
│  + USPs      │  │ Subtitle: [PT]│  │  │  Rendered   │  │
│  + Scroller  │  │ Background: □ │  │  │  Section    │  │
│  + Flexible  │  │ Buttons: [+]  │  │  │             │  │
│              │  └───────────────┘  │  └─────────────┘  │
└──────────────┴─────────────────────┴───────────────────┘
```

**Drag-and-drop:**
- Use `@dnd-kit/core` for section reordering
- Allow adding/removing sections
- Collapse/expand sections

**Section-specific forms:**
Each section type needs its own form component:

| Section | Form Requirements |
|---------|-------------------|
| `pageHeader` | title input, PT editor, boolean toggles, button array |
| `slideshow` | image array with drag-reorder, captions |
| `splitSection` | 2 item forms, each with image, title, subtitle, link |
| `uspSection` | heading, USP array (icon picker, title, text, link) |
| `solutionsScroller` | heading, subtitle |
| `flexibleSection` | layout picker, 3 block arrays (each block has own form) |

**Estimated effort:** 5-8 days for basic implementation

### 6. FlexibleSection Block Builder

The `flexibleSection` is essentially a page builder within a section. It needs:

- Layout selector (4 options)
- Block arrays for main/left/right columns
- Block type selector
- Per-block editors

**Block editors:**
- `flexTextBlock`: heading input, level selector, PT editor, button config
- `flexImageBlock`: image picker
- `flexMapBlock`: no config needed
- `flexFormBlock`: title, subtitle inputs

**Estimated effort:** 3-4 days

### 7. Reference Fields

**The Challenge:**
Content types reference each other:
- `solution.filters` → array of `filter` references
- `navigation.subItems` → array of `solution` references
- `filter.category` → single `filterCategory` reference

**UI Requirements:**
- Searchable dropdown for single references
- Multi-select for array references
- Reference preview (show name/thumbnail)

**Estimated effort:** 1-2 days

### 8. API Layer

**New API routes needed:**

```
/api/admin/content/
├── pages/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/route.ts     # GET, PUT, DELETE
├── solutions/
│   ├── route.ts
│   └── [id]/route.ts
├── filters/
│   ├── route.ts
│   └── [id]/route.ts
├── filter-categories/
│   ├── route.ts
│   └── [id]/route.ts
├── navigation/
│   └── route.ts          # GET, PUT (singleton)
├── site-parameters/
│   └── route.ts          # GET, PUT (singleton)
└── assets/
    └── upload/route.ts   # POST (image upload)
```

**Sanity Mutations:**
```typescript
// Create
await client.create({ _type: 'page', title: '...' });

// Update
await client.patch(id).set({ title: '...' }).commit();

// Delete
await client.delete(id);

// Upload asset
await client.assets.upload('image', file);
```

**Requires:** Sanity write token (currently only using read access)

**Estimated effort:** 2-3 days

---

## Technical Challenges

### 1. Sanity Write Access

**Current state:** Read-only client
**Needed:** Client with write token

```typescript
// src/sanity/client.ts - needs update
export const writeClient = createClient({
  projectId: "naj44gzh",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN, // New env var
  useCdn: false,
});
```

### 2. Portable Text Complexity

Portable Text is more than just rich text:
- Block styles (normal, h1-h4, blockquote)
- Marks (bold, italic, underline, links)
- Custom marks (could have code, highlight, etc.)
- Inline objects (could have image, reference)
- Block objects (could have code block, table)

Need to audit current Sanity schema to understand what PT features are used.

### 3. Concurrent Editing

Sanity Studio handles concurrent editing with real-time presence. Your admin panel would need:
- Optimistic locking (check `_rev` before save)
- Warning if document was modified by someone else
- No real-time collaboration (acceptable limitation)

### 4. Validation

Sanity schemas define validation rules. You'd need to:
- Replicate validation in the frontend
- Or accept potentially invalid data and rely on Sanity's validation errors

### 5. Preview/Draft Mode

Sanity has draft documents (`drafts.document-id`). Consider whether to:
- Work directly with published documents (simpler)
- Implement draft/publish workflow (more complex)

---

## Component Inventory

### New Components Needed

```
src/components/admin/content/
├── ContentList.tsx           # Generic list with filters/search
├── ContentForm.tsx           # Generic form wrapper
├── fields/
│   ├── TextField.tsx         # Text input with validation
│   ├── SlugField.tsx         # Auto-generate slug from title
│   ├── BooleanField.tsx      # Toggle/checkbox
│   ├── SelectField.tsx       # Dropdown select
│   ├── ReferenceField.tsx    # Single reference picker
│   ├── ReferencesField.tsx   # Multi reference picker
│   ├── ImageField.tsx        # Image picker with hotspot
│   ├── ImagesField.tsx       # Image array
│   ├── PortableTextField.tsx # Rich text editor
│   └── ArrayField.tsx        # Generic array with add/remove/reorder
├── page-builder/
│   ├── PageBuilder.tsx       # Main section builder
│   ├── SectionPalette.tsx    # Available sections
│   ├── SectionList.tsx       # Current sections
│   ├── SectionEditor.tsx     # Section form router
│   ├── SectionPreview.tsx    # Preview panel
│   └── sections/
│       ├── PageHeaderForm.tsx
│       ├── SlideshowForm.tsx
│       ├── SplitSectionForm.tsx
│       ├── UspSectionForm.tsx
│       ├── SolutionsScrollerForm.tsx
│       └── FlexibleSectionForm.tsx
├── block-builder/
│   ├── BlockList.tsx         # Block array editor
│   └── blocks/
│       ├── TextBlockForm.tsx
│       ├── ImageBlockForm.tsx
│       ├── MapBlockForm.tsx
│       └── FormBlockForm.tsx
└── image-editor/
    ├── ImageUploader.tsx     # Drag-drop upload
    ├── ImageCropper.tsx      # Crop/hotspot editor
    └── ImageLibrary.tsx      # Browse existing assets
```

### Estimated Component Count: ~30-40 components

---

## Effort Estimation

### Phase 1: Foundation (1-2 weeks)
- [ ] Sanity write client setup
- [ ] API routes for simple content types
- [ ] Basic field components (text, slug, boolean, select)
- [ ] Simple content editors (filters, categories, site parameters)

### Phase 2: References & Images (1 week)
- [ ] Reference field components
- [ ] Image upload to Sanity
- [ ] Image picker with hotspot editor
- [ ] Navigation editor

### Phase 3: Rich Text (1 week)
- [ ] TipTap integration
- [ ] Portable Text serialization
- [ ] Block style support
- [ ] Link/mark support

### Phase 4: Page Builder (2-3 weeks)
- [ ] Section palette and list
- [ ] Drag-and-drop reordering
- [ ] Section-specific forms (6 types)
- [ ] FlexibleSection block builder
- [ ] Preview functionality

### Phase 5: Polish (1 week)
- [ ] Validation
- [ ] Error handling
- [ ] Loading states
- [ ] Undo/redo (nice to have)
- [ ] Keyboard shortcuts (nice to have)

### Total Estimated Effort: 6-8 weeks

---

## Alternatives to Consider

### 1. Embedded Sanity Studio

Instead of building from scratch, embed Sanity Studio within your admin:

```tsx
// Option A: iframe
<iframe src="https://your-project.sanity.studio" />

// Option B: Sanity Studio as component (newer approach)
import { Studio } from 'sanity';
```

**Pros:** Full Sanity feature set, maintained by Sanity
**Cons:** Different UI style, requires separate auth, less control

### 2. Hybrid Approach

Build simple editors in your admin, link to Sanity Studio for complex editing:

```tsx
// For simple edits
<SimpleContentForm type="filter" />

// For page editing
<Button href={`https://your-project.sanity.studio/desk/page;${id}`}>
  Edit in Sanity Studio
</Button>
```

**Pros:** Faster to implement, best of both worlds
**Cons:** Split user experience

### 3. Sanity Studio V3 with Custom Branding

Customize Sanity Studio to match your admin UI and deploy at `/admin/studio`:

```typescript
// sanity.config.ts
export default defineConfig({
  theme: {
    // Custom colors matching your admin
  },
});
```

**Pros:** Minimal custom development
**Cons:** Still a separate application

---

## Recommendation

Given your assessment that this "might not be that difficult", I'd suggest:

### Start with Phase 1 + Hybrid

1. **Build simple editors** for filters, categories, site parameters
2. **Link to Sanity Studio** for page/solution editing
3. **Evaluate** if the custom editor adds enough value

This gives you ~80% of the admin functionality with ~20% of the effort.

### If you proceed with full custom studio:

1. **Portable Text is the bottleneck** - invest in getting this right first
2. **Reuse your SectionRenderer** - components for preview
3. **Consider Sanity's libraries**:
   - `@sanity/client` for mutations (already using for reads)
   - `@portabletext/editor` for rich text editing
   - `@sanity/image-url` for image handling (already using)

---

## Questions to Answer Before Starting

1. **What features of Sanity Studio do you actually use?**
   - If only basic editing, custom admin is feasible
   - If using validation, draft/publish, revision history - more work

2. **Who are the users?**
   - Just you? Simpler requirements
   - Multiple editors? Need better error handling, concurrent edit protection

3. **Do you need offline support?**
   - Sanity Studio works offline
   - Custom admin typically wouldn't

4. **What's the timeline?**
   - < 1 month: Hybrid approach
   - 1-2 months: Custom simple editors + Sanity for pages
   - 2-3 months: Full custom studio

---

## File Structure for Implementation

```
src/
├── app/admin/
│   └── content/
│       ├── page.tsx              # Content overview
│       ├── pages/
│       │   ├── page.tsx          # Pages list
│       │   └── [id]/page.tsx     # Page editor
│       ├── solutions/
│       │   ├── page.tsx          # Solutions list
│       │   └── [id]/page.tsx     # Solution editor
│       ├── filters/
│       │   └── page.tsx          # Filters management
│       ├── navigation/
│       │   └── page.tsx          # Navigation editor
│       └── settings/
│           └── page.tsx          # Site parameters
├── components/admin/content/     # (see component inventory above)
├── lib/
│   └── sanity/
│       ├── mutations.ts          # Create, update, delete helpers
│       └── validation.ts         # Field validation rules
└── app/api/admin/content/        # (see API routes above)
```

---

## Conclusion

Building a custom content studio is **doable but substantial**. The current admin architecture is excellent - authentication, layouts, and patterns are all solid. The main complexity lies in:

1. **Rich text editing** (~30% of effort)
2. **Page section builder** (~40% of effort)
3. **Image management** (~15% of effort)
4. **API layer** (~15% of effort)

Your intuition that it's "not that difficult" is partially correct - the simple parts (filter management, site settings) are indeed straightforward. The page builder with Portable Text support is where the real complexity lives.

**My recommendation:** Start with the hybrid approach, build confidence with simple editors, then expand to page editing if the value justifies the effort.
