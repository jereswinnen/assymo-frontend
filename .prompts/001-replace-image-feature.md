<objective>
Implement an "Afbeelding vervangen" (Replace Image) feature in the admin media detail page that allows users to swap an image file while preserving all existing references across the site.
</objective>

<context>
This is for the assymo-frontend Next.js admin panel, not Sanity Studio.

Current architecture:
- Images stored in Vercel Blob (URL is the unique identifier)
- Metadata in Postgres `image_metadata` table with URL as primary key
- References stored as full URLs in JSONB columns:
  - `pages.header_image` and `pages.sections`
  - `solutions.header_image` and `solutions.sections`
- Reference tracking already exists in delete endpoint for integrity checks

Key files:
@assymo-frontend/src/app/admin/content/media/[url]/page.tsx - Image detail page (add replace button here)
@assymo-frontend/src/app/api/admin/content/images/delete/route.ts - Has reference finding logic to reuse
@assymo-frontend/src/lib/storage.ts - Vercel Blob upload/delete functions
@assymo-frontend/src/lib/db.ts - Database connection
</context>

<requirements>
1. Add "Afbeelding vervangen" button to the image detail page sidebar
2. When clicked, open file picker for new image (same validation: image/*, max 10MB)
3. On file selection:
   - Upload new image to Vercel Blob
   - Find all references to old URL (reuse logic from delete endpoint)
   - Update all references in pages and solutions tables to use new URL
   - Migrate metadata record to new URL (preserve display_name)
   - Auto-generate new alt text for the new image
   - Delete old image from Vercel Blob
   - Delete old metadata record
4. Show loading state during the replacement process
5. Redirect to new image detail page after completion
6. Handle errors gracefully (rollback if possible, show error message)
</requirements>

<implementation>
Create a new API endpoint for the replace operation:
- `POST /api/admin/content/media/replace`
- Request body: `{ oldUrl: string, file: FormData }`
- Should be a single transaction where possible

The replacement flow:
1. Upload new blob first (so we have the new URL)
2. Begin database transaction
3. Update all JSONB references in pages table
4. Update all JSONB references in solutions table
5. Insert new metadata record (copy display_name, mark alt_text as pending)
6. Delete old metadata record
7. Commit transaction
8. Delete old blob from Vercel
9. Trigger background alt text generation for new image

For updating JSONB references, use PostgreSQL's `jsonb_set` or string replacement:
```sql
UPDATE pages
SET header_image = jsonb_set(header_image, '{url}', to_jsonb($newUrl))
WHERE header_image->>'url' = $oldUrl;

UPDATE pages
SET sections = REPLACE(sections::text, $oldUrl, $newUrl)::jsonb
WHERE sections::text LIKE '%' || $oldUrl || '%';
```

Similar updates for solutions table.
</implementation>

<output>
Create/modify these files:
- `./assymo-frontend/src/app/api/admin/content/media/replace/route.ts` - New API endpoint
- `./assymo-frontend/src/app/admin/content/media/[url]/page.tsx` - Add replace button and handler
</output>

<verification>
Test the feature:
1. Upload a test image
2. Use it in a page's header_image and in a section
3. Go to image detail and click "Afbeelding vervangen"
4. Select a new image file
5. Verify:
   - New image appears in media library
   - Old image is gone
   - Page still shows image (now the new one)
   - Alt text is regenerated
   - Display name is preserved
</verification>

<success_criteria>
- Replace button visible on image detail page
- File picker opens on click
- All references updated atomically
- Old image fully removed (blob + metadata)
- New alt text generated automatically
- User redirected to new image detail page
- No orphaned references or broken images
</success_criteria>
