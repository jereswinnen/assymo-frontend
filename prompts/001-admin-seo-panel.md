# Admin SEO Panel Implementation

<objective>
Implement a collapsible SEO panel in the admin page and solution editors that provides:
1. Google search preview (SERP preview)
2. Basic SEO score/checklist with real-time feedback
3. AI-assisted meta description generation (following the existing alt text pattern)
4. Fields for meta_title and meta_description with character counters
</objective>

<context>
<codebase_summary>
This is the Assymo admin CMS built with Next.js 16, using Neon Postgres for storage. The admin editors for pages and solutions follow a consistent pattern with a main content area (sections) and a sidebar for metadata.

Key patterns discovered:
- Page editor: `/src/app/admin/content/pages/[id]/page.tsx`
- Solution editor: `/src/app/admin/content/solutions/[id]/page.tsx`
- Both use `FieldGroup`, `FieldSet`, `Field`, `FieldLabel`, `FieldSeparator` components
- AI alt text generation pattern: `/src/app/api/admin/content/media/generate-alt/route.ts`
- Metadata helper: `/src/lib/getPageMetadata.ts` with `buildMetadata()` function
- Strings centralized in `/src/config/strings.ts` using `t()` helper

Current database schema (no SEO columns exist):
- `pages` table: id, title, slug, header_image, sections, is_homepage, site_id, created_at, updated_at
- `solutions` table: id, name, subtitle, slug, header_image, sections, order_rank, site_id, created_at, updated_at
</codebase_summary>

<existing_patterns>
Alt text generation API pattern to follow:
```typescript
// Uses OpenAI via Vercel AI SDK
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { CHATBOT_CONFIG } from "@/config/chatbot";

// Generate text with vision model
const { text } = await generateText({
  model: openai(CHATBOT_CONFIG.model),
  messages: [{ role: "user", content: "prompt here" }],
});
```

UI pattern from media page for AI generation button:
```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={generateAltText}
  disabled={generating}
>
  {generating ? (
    <>
      <Loader2Icon className="size-3 animate-spin" />
      {t("admin.loading.generating")}
    </>
  ) : (
    <>
      <SparklesIcon className="size-3" />
      {t("admin.misc.generateWithAI")}
    </>
  )}
</Button>
```
</existing_patterns>

<site_context>
- Site domain available via `useSiteContext()` hook: `currentSite?.domain`
- Pages URL: `/{slug}` or `/` for homepage
- Solutions URL: `/realisaties/{slug}`
- Default site name: "Assymo"
</site_context>
</context>

<requirements>
<database_changes>
Add two new columns to both `pages` and `solutions` tables:
- `meta_title` (text, nullable) - Custom SEO title (if null, use page title)
- `meta_description` (text, nullable) - Meta description for search engines

Migration SQL:
```sql
ALTER TABLE pages ADD COLUMN meta_title text;
ALTER TABLE pages ADD COLUMN meta_description text;

ALTER TABLE solutions ADD COLUMN meta_title text;
ALTER TABLE solutions ADD COLUMN meta_description text;
```
</database_changes>

<ui_components>
1. **SEO Panel Component** (`/src/components/admin/SeoPanel.tsx`)
   - Collapsible panel using Radix Collapsible or simple state toggle
   - Props: `title`, `slug`, `metaTitle`, `metaDescription`, `onMetaTitleChange`, `onMetaDescriptionChange`, `onGenerateDescription`, `generating`, `domain`, `basePath`

2. **Google Search Preview**
   - Show how the page will appear in Google search results
   - Title (blue link): Use metaTitle or fall back to title, append " — Assymo"
   - URL (green): Show full URL path
   - Description (gray): Show metaDescription or placeholder text
   - Use realistic Google styling (font sizes, colors, truncation)

3. **SEO Score/Checklist**
   - Title length: Optimal 50-60 chars, warning if >60 or <30
   - Description length: Optimal 150-160 chars, warning if >160 or <120
   - Simple visual indicators (checkmark for good, warning for issues)
   - No complex scoring, just practical guidance

4. **Character Counters**
   - Show current/optimal for both fields
   - Color-code: green (optimal), yellow (warning), red (too long)
</ui_components>

<api_endpoint>
Create `/src/app/api/admin/content/generate-meta-description/route.ts`:
- POST endpoint accepting `{ title, content }`
- `content` = concatenated text from page sections (extract from text blocks)
- Use OpenAI to generate a compelling meta description in Dutch
- Prompt should create SEO-friendly description, max 160 chars
- Follow the existing alt text generation pattern with `protectRoute()`

Example prompt for generation:
```
Genereer een meta description voor een webpagina in het Nederlands.
Titel: {title}
Inhoud: {content}

Vereisten:
- Maximaal 155 tekens
- Wervend en informatief
- Bevat een call-to-action indien passend
- Antwoord alleen met de meta description, niets anders.
```
</api_endpoint>

<frontend_changes>
1. Update `PageData` interface in page editor to include `meta_title`, `meta_description`
2. Update `SolutionData` interface in solution editor to include `meta_title`, `meta_description`
3. Add state for `metaTitle` and `metaDescription` in both editors
4. Add `SeoPanel` component to the sidebar in both editors
5. Include meta fields in the save payload (PUT request)
6. Track meta field changes in `hasChanges` logic
</frontend_changes>

<api_updates>
Update existing API routes to handle new fields:

`/src/app/api/admin/content/pages/[id]/route.ts`:
- GET: Include meta_title, meta_description in response
- PUT: Accept and save meta_title, meta_description

`/src/app/api/admin/content/solutions/[id]/route.ts`:
- GET: Include meta_title, meta_description in response
- PUT: Accept and save meta_title, meta_description
</api_updates>

<public_frontend>
Update `/src/lib/getPageMetadata.ts` and page metadata functions:
- `buildMetadata()` already accepts `title` and `description` params
- Update `getPageMetadata()` to use `meta_title` and `meta_description` from database
- Update page/solution `generateMetadata()` functions to pass custom SEO fields

Update content queries in `/src/lib/content.ts`:
- `_getPageBySlug`: Include meta_title, meta_description in SELECT
- `_getSolutionBySlug`: Include meta_title, meta_description in SELECT
</public_frontend>

<strings>
Add to `/src/config/strings.ts` under appropriate categories:
```typescript
// admin.labels
metaTitle: "SEO titel",
metaDescription: "Meta beschrijving",

// admin.headings
seo: "SEO",

// admin.placeholders
metaTitlePlaceholder: "Aangepaste titel voor zoekmachines",
metaDescriptionPlaceholder: "Korte beschrijving voor zoekmachines (max 160 tekens)",

// admin.misc
seoPreview: "Google preview",
seoTips: "SEO tips",
titleLength: "Titel lengte",
descriptionLength: "Beschrijving lengte",
optimal: "Optimaal",
tooLong: "Te lang",
tooShort: "Te kort",
characters: "tekens",
generateDescription: "Genereer",

// admin.messages
descriptionGenerated: "Meta beschrijving gegenereerd",
descriptionGenerateFailed: "Kon meta beschrijving niet genereren",
```
</strings>
</requirements>

<implementation_order>
1. Database migration (add columns to pages and solutions tables)
2. Create SeoPanel component with Google preview and checklist
3. Create generate-meta-description API endpoint
4. Update page editor (state, SeoPanel integration, save logic)
5. Update solution editor (state, SeoPanel integration, save logic)
6. Update page/solution API routes to handle new fields
7. Update content queries to include SEO fields
8. Update public generateMetadata functions to use custom SEO data
9. Add strings to strings.ts
10. Test the complete flow
</implementation_order>

<design_notes>
- SEO panel should be collapsed by default to not overwhelm editors
- Use existing UI components (Field, FieldLabel, Input, Textarea, Button)
- Google preview styling:
  - Title: text-[#1a0dab] text-lg truncate max-w-[600px]
  - URL: text-[#006621] text-sm
  - Description: text-[#545454] text-sm line-clamp-2
- Character counter colors: green < 90% optimal, yellow 90-100%, red > 100%
- SparklesIcon for AI generation (consistent with alt text)
- Place SEO panel after the header image section in the sidebar
</design_notes>

<files_to_create>
- `/src/components/admin/SeoPanel.tsx` - Main SEO panel component
- `/src/app/api/admin/content/generate-meta-description/route.ts` - AI generation endpoint
</files_to_create>

<files_to_modify>
- `/src/app/admin/content/pages/[id]/page.tsx` - Add SEO panel integration
- `/src/app/admin/content/solutions/[id]/page.tsx` - Add SEO panel integration
- `/src/app/api/admin/content/pages/[id]/route.ts` - Handle meta fields
- `/src/app/api/admin/content/solutions/[id]/route.ts` - Handle meta fields
- `/src/lib/content.ts` - Include meta fields in queries
- `/src/lib/getPageMetadata.ts` - Use custom meta fields
- `/src/app/(site)/[slug]/page.tsx` - Pass meta fields to buildMetadata
- `/src/app/(site)/realisaties/[slug]/page.tsx` - Pass meta fields to buildMetadata
- `/src/config/strings.ts` - Add Dutch UI strings
- `/src/types/content.ts` - Add meta fields to Page and Solution types
</files_to_modify>
</requirements>

<verification>
After implementation, verify:
1. SEO panel appears in page editor sidebar (collapsed by default)
2. SEO panel appears in solution editor sidebar (collapsed by default)
3. Google preview updates in real-time as fields change
4. Character counters show correct counts with color coding
5. AI generate button creates relevant Dutch meta descriptions
6. Changes are saved correctly to database
7. Public pages use custom meta_title/meta_description when set
8. Falls back to page title and default description when not set
9. All new strings are in Dutch and accessible via t() helper
</verification>

<constraints>
- Use existing UI patterns and components
- Follow Dutch language for all user-facing strings
- Use "Bewaren" for save (not "Opslaan")
- Keep it simple - no complex SEO analysis
- AI generation should be optional, not required
- SEO fields are nullable - system works without them
</constraints>
