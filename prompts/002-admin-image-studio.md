# Admin AI Image Studio Implementation

<objective>
Create a phased implementation plan (as a markdown file) for an AI Image Studio in the admin panel. The plan should be broken into small, testable phases with a checklist at the top for tracking progress.

The Image Studio allows users to:
1. Upload or drag-drop an image (kept as base64, not saved to blob)
2. Use a chat interface to request AI-powered edits
3. Generate multiple temporary versions through iterative prompts
4. Browse version history and save any version to blob storage
</objective>

<output_format>
Generate a markdown file at `.planning/IMAGE-STUDIO-PLAN.md` with:

1. **Checklist at top** - All phases as checkboxes for tracking
2. **Phase sections** - Each phase should include:
   - Clear goal/deliverable
   - Files to create/modify
   - Implementation details
   - Testing criteria (how to verify it works before moving on)
3. **Phases should be small** - Each phase should be completable and testable independently
</output_format>

<context>
<codebase_summary>
This is the Assymo admin CMS built with Next.js 16, using Neon Postgres for storage and Vercel Blob for images. The admin follows consistent patterns with sidebar layouts and shadcn components.

Key existing patterns:
- Media detail page: `/src/app/admin/content/media/[url]/page.tsx` - 2-column layout with image preview and sidebar
- Media library: `/src/app/admin/content/media/page.tsx` - drag-drop upload with dnd-kit
- Chatbot component: `/src/components/chatbot/Chatbot.tsx` - chat UI with InputGroup textarea
- Image upload API: `/api/admin/content/images/upload` - Vercel Blob handler
- Strings centralized in `/src/config/strings.ts` using `t()` helper
- UI components in `/src/components/ui/` (field.tsx, input-group.tsx, etc.)
- Header actions via `useAdminHeaderActions()` hook
- Permission checks via `useRequireFeature()` hook
</codebase_summary>

<existing_ui_patterns>
Media detail sidebar layout:
```tsx
<div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] flex flex-col gap-6">
  <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
    {/* Image preview: md:col-span-2 */}
    <div className="md:col-span-2 min-h-0">
      <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
        <Image src={url} alt={alt} fill className="object-contain" />
      </div>
    </div>

    {/* Sidebar */}
    <div className="bg-muted rounded-lg p-4">
      {/* Content */}
    </div>
  </div>
</div>
```

Chatbot input pattern from Chatbot.tsx:
```tsx
<InputGroup>
  <InputGroupTextarea
    ref={textareaRef}
    placeholder="Stel je vraag..."
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyDown}
    rows={2}
    disabled={isThinking}
  />
  <InputGroupAddon align="block-end">
    <InputGroupText className="text-xs text-muted-foreground">
      {/* Status text */}
    </InputGroupText>
    <InputGroupButton type="submit" variant="default" size="icon-xs">
      <ArrowUpIcon />
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```
</existing_ui_patterns>

<ai_sdk_patterns>
AI SDK image generation (Vercel AI SDK with OpenAI):
```typescript
import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

// Image editing with input image
const { image } = await generateImage({
  model: openai.image('gpt-image-1'),
  prompt: {
    text: 'Turn the cat into a dog but retain the style',
    images: [imageBuffer], // Buffer, Uint8Array, or base64 string
  },
  size: '1024x1024', // Also: 1536x1024, 1024x1536
});

// Response contains base64 and other formats
// image.base64, image.mimeType
```
</ai_sdk_patterns>

<available_models>
OpenAI image models to support:
- `gpt-image-1-mini` - Faster, economical option
- `gpt-image-1` - Standard quality
- `gpt-image-1.5-2025-12-16` - Latest, highest quality (pinned version)

All gpt-image models support:
- Text-to-image generation
- Image editing with input images via `prompt.images`
- Size options: 1024x1024, 1536x1024, 1024x1536
- Quality option via providerOptions: { openai: { quality: 'high' } }
</available_models>
</context>

<phase_breakdown>
Structure the implementation into these phases:

## Phase 1: Page Shell & Navigation
- Create empty page at `/src/app/admin/content/image-studio/page.tsx`
- Add navigation link to admin sidebar
- Basic 2-column layout structure (empty placeholders)
- Permission check using existing `media` feature
- Test: Page loads, shows in nav, unauthorized users redirected

## Phase 2: Image Upload Drop Zone
- Implement drag-drop zone for left column (empty state)
- File input fallback for click-to-upload
- Convert uploaded file to base64 (NOT to blob storage)
- Store as first "version" in local state
- Display uploaded image in viewer
- Test: Can upload image, see it displayed, stays in memory (refresh loses it)

## Phase 3: Version State & Thumbnails
- Define TypeScript interfaces for ImageVersion and state
- Implement version strip below main image
- Click thumbnail to switch displayed version
- "Original" badge on first version
- Test: Upload image shows as version 1 with Original badge

## Phase 4: Chat UI Shell
- Build chat sidebar in right column
- Message list (empty initially)
- Input field with InputGroup pattern (disabled until image uploaded)
- Model selector dropdown (3 models)
- Test: Chat UI renders, input disabled without image, model selector works

## Phase 5: API Endpoint
- Create `/api/admin/content/image-studio/generate/route.ts`
- Accept: prompt, imageBase64, model
- Validate model against allowlist
- Call OpenAI via AI SDK generateImage
- Return generated image as base64
- Test: Can call API directly with curl/Postman, returns image

## Phase 6: Connect Chat to API
- Wire up chat input submission
- Add user message to chat on submit
- Call API with current version + prompt + model
- Show loading state during generation
- On success: add assistant message, add new version, select it
- On error: show error message in chat
- Test: Full flow - type prompt, see loading, new version appears

## Phase 7: Save to Library
- Add "Bewaren in bibliotheek" header action button
- Convert current version base64 to File/Blob
- Upload using existing Vercel Blob pattern
- Redirect to media detail page on success
- Test: Generate an image, save it, appears in media library

## Phase 8: Polish & Reset
- Add "Nieuw" button to clear and start fresh
- Confirmation dialog if unsaved versions exist
- Add all Dutch strings to strings.ts
- Loading states and error handling polish
- Test: Complete workflow end-to-end

</phase_breakdown>

<state_management>
Local component state (no database persistence):
```typescript
interface ImageVersion {
  id: string;           // nanoid for unique key
  base64: string;       // Image data as base64 data URL
  mimeType: string;     // e.g., 'image/png'
  prompt: string;       // The prompt that generated this version
  timestamp: Date;      // When generated
  isOriginal: boolean;  // True for the uploaded image
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  versionId?: string;   // Links to generated version (for assistant messages)
}

// Component state
const [versions, setVersions] = useState<ImageVersion[]>([]);
const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isGenerating, setIsGenerating] = useState(false);
const [selectedModel, setSelectedModel] = useState('gpt-image-1');
```

Rationale for no persistence:
- Base64 images are too large for database storage
- Creative workflow is transient (like Photoshop without saving)
- Users explicitly save the versions they want to keep
- Keeps implementation simple
</state_management>

<strings_to_add>
The strings file at `/src/config/strings.ts` uses a nested structure under `ADMIN_STRINGS.admin`. Access strings via `t('admin.category.key')`.

Add the following strings to their respective categories in the `ADMIN_STRINGS.admin` object:

```typescript
// In admin.nav (add new navigation item)
nav: {
  // ... existing entries
  imageStudio: "Image Studio",
}

// In admin.headings
headings: {
  // ... existing entries
  imageStudio: "Image Studio",
  unsavedChanges: "Niet-opgeslagen wijzigingen",
}

// In admin.labels
labels: {
  // ... existing entries
  model: "Model",
  version: "Versie",
  versions: "Versies",
}

// In admin.placeholders
placeholders: {
  // ... existing entries
  describeEdit: "Beschrijf je wijziging...",
}

// In admin.buttons
buttons: {
  // ... existing entries
  saveToLibrary: "Bewaren in bibliotheek",
  new: "Nieuw",
  startOver: "Opnieuw beginnen",
}

// In admin.misc
misc: {
  // ... existing entries
  dropImageHere: "Sleep een afbeelding hierheen of klik om te uploaden",
  startWithImage: "Upload eerst een afbeelding om te beginnen",
  originalImage: "Origineel",
  modelFast: "Snel",
  modelStandard: "Standaard",
  modelBest: "Beste kwaliteit",
  versionOf: "van", // "Versie 2 van 5"
}

// In admin.messages (success/error toasts)
messages: {
  // ... existing entries
  imageGenerated: "Afbeelding gegenereerd",
  imageGenerateFailed: "Kon afbeelding niet genereren",
}

// In admin.dialogs
dialogs: {
  // ... existing entries
  unsavedVersionsDesc: "Je hebt onopgeslagen versies. Weet je zeker dat je opnieuw wilt beginnen?",
}

// In admin.empty
empty: {
  // ... existing entries
  noImageYet: "Nog geen afbeelding",
}
```

Note: `admin.loading.generating` already exists as "Genereren..." - reuse it.
</strings_to_add>

<permissions>
The admin uses a feature-based permission system defined in `/src/lib/permissions/`.

**Key files:**
- `types.ts` - Defines `FEATURES` constant and role mappings
- `check.ts` - Permission checking functions
- `useRequireFeature.ts` - Client-side hook for feature access

**Image Studio uses existing `media` feature** - no new feature needed since it's an extension of media management.

**Client-side permission check pattern:**
```typescript
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";

export default function ImageStudioPage() {
  const { authorized, loading } = useRequireFeature("media");

  // Show nothing while checking permissions (redirects if unauthorized)
  if (loading || !authorized) {
    return null;
  }

  return (
    // ... page content
  );
}
```

**API route protection pattern:**
```typescript
import { protectRoute } from "@/lib/api-protect";

export async function POST(request: Request) {
  // Returns Response if unauthorized, null if authorized
  const authResult = await protectRoute({ feature: "media" });
  if (authResult) return authResult;

  // ... handle request
}
```

**Feature types:**
- Site-scoped (content): `pages`, `solutions`, `navigation`, `filters`, `media`, `parameters`
- Global (business): `appointments`, `emails`, `conversations`, `settings`
- Admin-only: `users`, `sites`

`media` is site-scoped, meaning access is limited to the user's assigned sites.
</permissions>

<files_overview>
Files to create:
- `/src/app/admin/content/image-studio/page.tsx` - Main page component
- `/src/app/api/admin/content/image-studio/generate/route.ts` - Generation API
- `/.planning/IMAGE-STUDIO-PLAN.md` - This implementation plan

Files to modify:
- `/src/config/strings.ts` - Add Dutch UI strings
- Admin navigation config - Add nav link (find existing pattern)
</files_overview>

<constraints>
- Use existing UI patterns and shadcn components
- Follow Dutch language for all user-facing strings
- Use "Bewaren" for save (not "Opslaan") - see strings.ts standards
- Add all new strings to the correct categories in `ADMIN_STRINGS.admin` object
- Access strings via `t('admin.category.key')` helper from `@/config/strings`
- No database persistence for editing sessions
- Images stay as base64 until explicitly saved to blob
- Reuse `media` permission via `useRequireFeature("media")` - no new feature needed
- Protect API routes with `protectRoute({ feature: "media" })`
- No mask/inpainting UI (keep scope focused on basic editing)
- Each phase must be independently testable
</constraints>

<execution_instructions>
1. Create the `.planning/` directory if it doesn't exist
2. Generate `IMAGE-STUDIO-PLAN.md` with:
   - Checklist of all phases at the top (using `- [ ]` markdown checkboxes)
   - Detailed section for each phase
   - Clear "How to test" criteria for each phase
3. Do NOT implement any code yet - only create the plan document
</execution_instructions>
