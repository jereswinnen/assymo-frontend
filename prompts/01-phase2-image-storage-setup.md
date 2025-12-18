# Phase 2: Image Storage Setup

<objective>
Implement Vercel Blob image storage for the CMS, enabling authenticated image uploads and deletions through a clean API.
</objective>

<context>
<file path="docs/SANITY_ADMIN_STUDIO_ANALYSIS.md" sections="Phase 2: Image Storage Setup" />
<current_state>
- Phase 1 complete: CMS database tables created in Neon (pages, solutions, filter_categories, filters, etc.)
- Next.js 15 App Router project with existing admin authentication via Better Auth
- Auth utility exists at `src/lib/auth-utils.ts` with `isAuthenticated()` function
- Existing admin API routes follow pattern in `src/app/api/admin/` using NextResponse
</current_state>
</context>

<requirements>
<functional>
1. Install @vercel/blob package
2. Create storage helper module at `src/lib/storage.ts` with:
   - `uploadImage(file: File)` - uploads file, returns `{ url, filename }`
   - `deleteImage(url: string)` - deletes blob by URL
3. Create upload API route at `src/app/api/admin/content/images/upload/route.ts`:
   - POST handler accepting multipart form data
   - Requires authentication via `isAuthenticated()`
   - Returns JSON with uploaded blob URL
4. Optionally create delete API route at `src/app/api/admin/content/images/delete/route.ts`
</functional>

<technical>
- Use `put` and `del` from `@vercel/blob`
- Set `access: 'public'` for uploaded images
- Token reads automatically from `BLOB_READ_WRITE_TOKEN` env var
- Follow existing admin API route patterns (see `src/app/api/admin/conversations/route.ts`)
- Add proper TypeScript types
- Handle errors gracefully with appropriate HTTP status codes
</technical>

<validation>
- TypeScript compiles without errors (`npx tsc --noEmit`)
- API route returns proper JSON responses
- Unauthorized requests return 401
- Missing file returns 400
</validation>
</requirements>

<implementation_notes>
- The BLOB_READ_WRITE_TOKEN will need to be added to .env.local (user will get from Vercel dashboard)
- Images will be stored at Vercel's blob storage CDN
- No need to update next.config.js for image domains - Vercel Blob URLs work automatically
</implementation_notes>

<references>
- Vercel Blob SDK: https://vercel.com/docs/vercel-blob/using-blob-sdk
- Server Uploads: https://vercel.com/docs/vercel-blob/server-upload
- Next.js Blob Starter: https://vercel.com/templates/next.js/blob-starter
</references>
