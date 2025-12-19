# Image Viewer Improvements

<objective>
Enhance the admin media page with an improved image viewer UX, including editable image metadata (filename, alt text) stored in Vercel Blob's native metadata, and a detail page for each image.
</objective>

<context>
<file path="src/app/admin/content/media/page.tsx" note="Current media grid page with image cards" />
<file path="src/app/api/admin/content/media/route.ts" note="API returning Vercel Blob list" />
<file path="src/lib/storage.ts" note="Upload/delete helpers using @vercel/blob" />
<current_state>
- Images are stored in Vercel Blob storage
- Media page displays grid of images with hover overlay (copy URL, delete buttons)
- No metadata storage - currently just using Vercel Blob's basic response fields
- Images have object-cover styling in the grid already
</current_state>
</context>

<requirements>
<functional>
1. **Media Grid Page Updates** (`src/app/admin/content/media/page.tsx`):
   - Remove "copy URL" button and `copyUrl` function
   - Move delete button to top-right corner overlay (visible on hover)
   - Make entire card clickable to navigate to detail page
   - Keep image filling the card with object-cover
   - Use URL-encoded blob URL as the route parameter (e.g., `/admin/content/media/[encodedUrl]`)

2. **Image Detail Page** (`src/app/admin/content/media/[url]/page.tsx`):
   - Layout: Image on left (large preview), editable form on right
   - Form fields:
     - Bestandsnaam (filename) - text input, prefilled from pathname
     - Alt tekst (alt text) - plain textarea (no RichText), from blob metadata
     - Date uploaded - display only, formatted in Dutch
   - Save button to update metadata
   - Back button to return to media list
   - Delete button with confirmation dialog

3. **Storage Helper Updates** (`src/lib/storage.ts`):
   - Update `uploadImage` to accept optional metadata (altText, displayName)
   - Add `getImageMetadata(url: string)` using `head()` from @vercel/blob
   - Add `updateImageMetadata(url: string, metadata)` using `copy()` to update metadata

4. **API Routes**:
   - `GET /api/admin/content/media` - Already exists, ensure metadata is included in list response
   - `GET /api/admin/content/media/[url]` - Get single blob with metadata using `head()`
   - `PUT /api/admin/content/media/[url]` - Update blob metadata using `copy()` with new metadata
   - Delete route already exists at `/api/admin/content/images/delete`

5. **Public Helper** (`src/lib/content.ts`):
   - Add `getImageAltText(url: string)` function that fetches alt text from blob metadata
   - This enables frontend components to get alt text when rendering images
</functional>

<technical>
- Use Vercel Blob's native metadata feature (no database table needed):
  - `put()` accepts `metadata` object for initial upload
  - `head()` returns blob info including metadata
  - `copy()` can update metadata by copying blob to same URL with new metadata
  - `list()` returns blobs with their metadata
- Metadata fields: `altText` (string), `displayName` (string)
- Use URL-safe encoding for blob URLs in route params (encodeURIComponent/decodeURIComponent)
- Use existing admin layout patterns (title in layout header via getRouteLabel)
- Follow existing form patterns from other admin pages (pages/[id], solutions/[id])
- Use Card, CardHeader, CardContent components for form layout
- Add route to getRouteLabel in admin layout for "Afbeelding bewerken"
</technical>

<validation>
- TypeScript compiles without errors (`npx tsc --noEmit`)
- Grid displays images properly with hover-to-delete functionality
- Clicking image navigates to detail page with encoded URL
- Saving updates persists metadata to Vercel Blob
- Deleting removes from Blob storage
- Alt text is retrievable via `getImageAltText` helper using `head()`
</validation>
</requirements>

<implementation_notes>
- Vercel Blob metadata is limited to 1KB total and string values only (sufficient for alt text)
- Use `copy()` with `addRandomSuffix: false` to update metadata in place
- Existing images without metadata will have undefined metadata fields - handle gracefully
- The encoded URL approach avoids needing a separate ID system
- Reference: https://vercel.com/docs/vercel-blob/using-blob-sdk
</implementation_notes>
