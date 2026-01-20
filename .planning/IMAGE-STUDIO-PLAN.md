# AI Image Studio - Implementation Plan

## Progress Checklist

- [x] **Phase 1**: Page Shell & Navigation
- [x] **Phase 2**: Image Upload Drop Zone
- [x] **Phase 3**: Version State & Thumbnails
- [x] **Phase 4**: Chat UI Shell
- [x] **Phase 5**: API Endpoint
- [x] **Phase 6**: Connect Chat to API
- [ ] **Phase 7**: Save to Library
- [ ] **Phase 8**: Polish & Reset

---

## Phase 1: Page Shell & Navigation

### Goal
Create the basic page structure with navigation link and permission checks.

### Files to Create
- `/src/app/admin/content/image-studio/page.tsx`

### Files to Modify
- Admin sidebar navigation (find existing nav config)
- `/src/config/strings.ts` - Add `nav.imageStudio: "Image Studio"`

### Implementation Details

```tsx
// /src/app/admin/content/image-studio/page.tsx
"use client";

import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { Loader2Icon } from "lucide-react";

export default function ImageStudioPage() {
  const { authorized, loading } = useRequireFeature("media");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
        {/* Left: Image viewer placeholder */}
        <div className="md:col-span-2 min-h-0">
          <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Image viewer (Phase 2)</p>
          </div>
        </div>

        {/* Right: Chat sidebar placeholder */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground">Chat sidebar (Phase 4)</p>
        </div>
      </div>
    </div>
  );
}
```

### How to Test
1. Start dev server: `pnpm dev`
2. Navigate to `/admin/content/image-studio`
3. Verify: Page loads with placeholder content
4. Verify: Navigation link appears in admin sidebar under Content
5. Verify: User without `media` permission is redirected (test with restricted user)

---

## Phase 2: Image Upload Drop Zone

### Goal
Implement drag-drop upload that converts images to base64 (no blob storage).

### Files to Modify
- `/src/app/admin/content/image-studio/page.tsx`

### Files to Add Strings
- `/src/config/strings.ts`:
  - `empty.noImageYet: "Nog geen afbeelding"`
  - `empty.noImageYetDesc: "Upload een afbeelding of selecteer er één uit de bibliotheek om te beginnen."`

### Implementation Details

Uses the `Empty` component pattern (like pages/solutions) with drag-drop support and the existing `MediaLibraryDialog`.

```tsx
// Add to page.tsx
import { useRef, useState } from "react";
import { ImageIcon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/config/strings";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { MediaLibraryDialog } from "@/components/admin/media/MediaLibraryDialog";
import { toast } from "sonner";

// Inside component:
const [imageData, setImageData] = useState<string | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [showMediaLibrary, setShowMediaLibrary] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert URL to base64 (for media library selection)
const urlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      base64: reader.result as string,
      mimeType: blob.type,
    });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const handleFile = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    toast.error(t("admin.messages.fileMustBeImage"));
    return;
  }
  const base64 = await fileToBase64(file);
  setImageData(base64);
};

// Handle selection from media library
const handleMediaSelect = async (url: string) => {
  try {
    const { base64 } = await urlToBase64(url);
    setImageData(base64);
    // Note: In Phase 3, this will create a version instead
  } catch (error) {
    console.error("Failed to load image from library:", error);
    toast.error(t("admin.messages.imageLoadFailed"));
  }
  setShowMediaLibrary(false);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) handleFile(file);
  // Reset input so same file can be selected again
  e.target.value = "";
};

// In JSX - replace left column placeholder:
<div className="md:col-span-2 min-h-0 flex flex-col">
  {imageData ? (
    <div className="relative flex-1 w-full overflow-hidden rounded-lg bg-muted">
      <img
        src={imageData}
        alt="Geselecteerde afbeelding"
        className="h-full w-full object-contain"
      />
    </div>
  ) : (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex-1 rounded-lg transition-colors",
        isDragging && "bg-primary/5 ring-2 ring-primary ring-dashed"
      )}
    >
      <Empty className="h-full flex flex-col justify-center border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>{t("admin.empty.noImageYet")}</EmptyTitle>
          <EmptyDescription>
            {t("admin.empty.noImageYetDesc")}
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon className="size-4" />
            {t("admin.buttons.upload")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMediaLibrary(true)}
          >
            <ImageIcon className="size-4" />
            {t("admin.buttons.library")}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </Empty>
    </div>
  )}
</div>

{/* Media Library Dialog */}
<MediaLibraryDialog
  open={showMediaLibrary}
  onOpenChange={setShowMediaLibrary}
  onSelect={handleMediaSelect}
/>
```

### How to Test
1. Refresh page - should show drop zone with Upload and Bibliotheek buttons
2. Drag an image file over - border should highlight
3. Drop image - should display in viewer
4. Click "Upload" button - file picker opens, select image - displays
5. Click "Bibliotheek" button - media library dialog opens
6. Select an image from library - dialog closes, image displays in viewer
7. Refresh page - image is gone (not persisted) ✓

---

## Phase 3: Version State & Thumbnails

### Goal
Track multiple image versions with thumbnail strip for selection.

### Files to Modify
- `/src/app/admin/content/image-studio/page.tsx`

### Files to Add Strings
- `/src/config/strings.ts`:
  - `misc.originalImage: "Origineel"`
  - `labels.version: "Versie"`
  - `labels.versions: "Versies"`

### Implementation Details

```tsx
// Types
interface ImageVersion {
  id: string;
  base64: string;
  mimeType: string;
  prompt: string;
  timestamp: Date;
  isOriginal: boolean;
}

// State (replace simple imageData state)
const [versions, setVersions] = useState<ImageVersion[]>([]);
const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

// Create a version from base64 data
const createOriginalVersion = (base64: string, mimeType: string): ImageVersion => ({
  id: crypto.randomUUID(),
  base64,
  mimeType,
  prompt: t("admin.misc.originalImage"), // "Origineel"
  timestamp: new Date(),
  isOriginal: true,
});

// Update handleFile to create a version
const handleFile = async (file: File) => {
  if (!file.type.startsWith("image/")) return;
  const base64 = await fileToBase64(file);
  const version = createOriginalVersion(base64, file.type);
  setVersions([version]);
  setCurrentVersionIndex(0);
};

// Update handleMediaSelect to create a version
const handleMediaSelect = async (url: string) => {
  try {
    const { base64, mimeType } = await urlToBase64(url);
    const version = createOriginalVersion(base64, mimeType);
    setVersions([version]);
    setCurrentVersionIndex(0);
  } catch (error) {
    console.error("Failed to load image from library:", error);
    toast.error(t("admin.messages.imageLoadFailed"));
  }
  setShowMediaLibrary(false);
};

// Current version helper
const currentVersion = versions[currentVersionIndex];

// Version strip component (below main image)
{versions.length > 0 && (
  <div className="flex gap-2 overflow-x-auto py-2 mt-2">
    {versions.map((version, index) => (
      <button
        key={version.id}
        onClick={() => setCurrentVersionIndex(index)}
        className={cn(
          "relative flex-shrink-0 size-16 rounded-md overflow-hidden border-2 transition-colors",
          index === currentVersionIndex
            ? "border-primary"
            : "border-transparent hover:border-muted-foreground/50"
        )}
      >
        <img
          src={version.base64}
          alt={version.prompt}
          className="size-full object-cover"
        />
        {version.isOriginal && (
          <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/60 text-white px-1 truncate">
            {t("admin.misc.originalImage")}
          </span>
        )}
      </button>
    ))}
  </div>
)}
```

### How to Test
1. Upload an image via drag-drop or file picker
2. Verify: Single thumbnail appears with "Origineel" badge
3. Verify: Thumbnail has highlight border (selected state)
4. Verify: Main image matches thumbnail
5. Click "Nieuw" (or refresh) and select image from Bibliotheek
6. Verify: Same result - single thumbnail with "Origineel" badge
7. (Future: After Phase 6, multiple versions will appear here)

---

## Phase 4: Chat UI Shell

### Goal
Build the chat sidebar with message list, input field, and model selector.

### Files to Modify
- `/src/app/admin/content/image-studio/page.tsx`

### Files to Add Strings
- `/src/config/strings.ts`:
  - `labels.model: "Model"`
  - `placeholders.describeEdit: "Beschrijf je wijziging..."`
  - `misc.startWithImage: "Upload eerst een afbeelding om te beginnen"`
  - `misc.modelFast: "Snel"`
  - `misc.modelStandard: "Standaard"`
  - `misc.modelBest: "Beste kwaliteit"`

### Implementation Details

```tsx
// Additional imports
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ArrowUpIcon } from "lucide-react";

// Types
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  versionId?: string;
}

// State
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState("");
const [selectedModel, setSelectedModel] = useState("gpt-image-1");
const textareaRef = useRef<HTMLTextAreaElement>(null);

const hasImage = versions.length > 0;

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};

const handleSubmit = () => {
  if (!input.trim() || !hasImage) return;
  // Will be implemented in Phase 6
  console.log("Submit:", input, selectedModel);
  setInput("");
};

// Chat sidebar JSX (right column)
<div className="bg-muted rounded-lg p-4 flex flex-col h-full">
  {/* Model selector */}
  <div className="mb-4">
    <label className="text-sm font-medium mb-2 block">
      {t("admin.labels.model")}
    </label>
    <Select value={selectedModel} onValueChange={setSelectedModel}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gpt-image-1-mini">
          GPT Image Mini ({t("admin.misc.modelFast")})
        </SelectItem>
        <SelectItem value="gpt-image-1">
          GPT Image ({t("admin.misc.modelStandard")})
        </SelectItem>
        <SelectItem value="gpt-image-1.5-2025-12-16">
          GPT Image 1.5 ({t("admin.misc.modelBest")})
        </SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Messages list */}
  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
    {messages.length === 0 && (
      <p className="text-sm text-muted-foreground text-center py-8">
        {hasImage
          ? t("admin.placeholders.describeEdit")
          : t("admin.misc.startWithImage")}
      </p>
    )}
    {messages.map((message) => (
      <div
        key={message.id}
        className={cn(
          "flex",
          message.role === "user" ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-background border"
          )}
        >
          {message.content}
        </div>
      </div>
    ))}
  </div>

  {/* Input */}
  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <InputGroup>
      <InputGroupTextarea
        ref={textareaRef}
        placeholder={t("admin.placeholders.describeEdit")}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={!hasImage}
      />
      <InputGroupAddon align="block-end">
        <InputGroupButton
          type="submit"
          variant="default"
          size="icon-xs"
          disabled={!input.trim() || !hasImage}
        >
          <ArrowUpIcon className="size-4" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </form>
</div>
```

### How to Test
1. Without image: Input should be disabled, shows "Upload eerst..."
2. Upload image: Input becomes enabled
3. Model selector: All 3 options visible and selectable
4. Type text and press Enter: Console logs (no API call yet)
5. Shift+Enter: Creates newline (doesn't submit)

---

## Phase 5: API Endpoint

### Goal
Create the API route that calls OpenAI's image generation.

### Files to Create
- `/src/app/api/admin/content/image-studio/generate/route.ts`

### Implementation Details

```typescript
// /src/app/api/admin/content/image-studio/generate/route.ts
import { generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { protectRoute } from "@/lib/api-protect";

const ALLOWED_MODELS = [
  "gpt-image-1-mini",
  "gpt-image-1",
  "gpt-image-1.5-2025-12-16",
];

export async function POST(request: Request) {
  // Check authentication and media permission
  const authResult = await protectRoute({ feature: "media" });
  if (authResult) return authResult;

  try {
    const { prompt, imageBase64, model } = await request.json();

    // Validate inputs
    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json({ error: "Image is required" }, { status: 400 });
    }

    if (!ALLOWED_MODELS.includes(model)) {
      return Response.json({ error: "Invalid model" }, { status: 400 });
    }

    // Convert base64 data URL to buffer
    // Format: "data:image/png;base64,iVBORw0KGgo..."
    const base64Data = imageBase64.split(",")[1];
    if (!base64Data) {
      return Response.json({ error: "Invalid image format" }, { status: 400 });
    }
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Call OpenAI
    const { image } = await generateImage({
      model: openai.image(model),
      prompt: {
        text: prompt,
        images: [imageBuffer],
      },
      size: "1024x1024",
    });

    return Response.json({
      base64: `data:${image.mimeType};base64,${image.base64}`,
      mimeType: image.mimeType,
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
```

### How to Test
Test with curl (replace with valid base64 image):
```bash
# Get a small test image as base64
TEST_IMAGE=$(curl -s "https://placekitten.com/200/200" | base64)

# Call the API (requires valid auth cookie)
curl -X POST http://localhost:3000/api/admin/content/image-studio/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d "{
    \"prompt\": \"Make the image black and white\",
    \"imageBase64\": \"data:image/jpeg;base64,$TEST_IMAGE\",
    \"model\": \"gpt-image-1-mini\"
  }"
```

Expected: Returns JSON with `base64` and `mimeType` fields.

Alternative: Test via browser console on the admin page (after logging in):
```javascript
const response = await fetch('/api/admin/content/image-studio/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Make it grayscale',
    imageBase64: 'data:image/png;base64,...', // paste actual base64
    model: 'gpt-image-1-mini'
  })
});
const data = await response.json();
console.log(data);
```

---

## Phase 6: Connect Chat to API

### Goal
Wire up the chat interface to call the API and display results.

### Files to Modify
- `/src/app/admin/content/image-studio/page.tsx`

### Files to Add Strings
- `/src/config/strings.ts`:
  - `messages.imageGenerated: "Afbeelding gegenereerd"`
  - `messages.imageGenerateFailed: "Kon afbeelding niet genereren"`

### Implementation Details

```tsx
// Add state
const [isGenerating, setIsGenerating] = useState(false);
const messagesEndRef = useRef<HTMLDivElement>(null);

// Auto-scroll on new messages
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// Update handleSubmit
const handleSubmit = async () => {
  if (!input.trim() || !hasImage || isGenerating) return;

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: input.trim(),
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setIsGenerating(true);

  try {
    const response = await fetch("/api/admin/content/image-studio/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userMessage.content,
        imageBase64: currentVersion.base64,
        model: selectedModel,
      }),
    });

    if (!response.ok) {
      throw new Error("Generation failed");
    }

    const data = await response.json();

    // Create new version
    const newVersion: ImageVersion = {
      id: crypto.randomUUID(),
      base64: data.base64,
      mimeType: data.mimeType,
      prompt: userMessage.content,
      timestamp: new Date(),
      isOriginal: false,
    };

    setVersions((prev) => [...prev, newVersion]);
    setCurrentVersionIndex(versions.length); // Select new version

    // Add assistant message
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: t("admin.messages.imageGenerated"),
      timestamp: new Date(),
      versionId: newVersion.id,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    toast.success(t("admin.messages.imageGenerated"));
  } catch (error) {
    console.error("Generation failed:", error);

    const errorMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: t("admin.messages.imageGenerateFailed"),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, errorMessage]);
    toast.error(t("admin.messages.imageGenerateFailed"));
  } finally {
    setIsGenerating(false);
  }
};

// Update InputGroupButton to show loading
<InputGroupButton
  type="submit"
  variant="default"
  size="icon-xs"
  disabled={!input.trim() || !hasImage || isGenerating}
>
  {isGenerating ? (
    <Loader2Icon className="size-4 animate-spin" />
  ) : (
    <ArrowUpIcon className="size-4" />
  )}
</InputGroupButton>

// Add scroll anchor at end of messages
<div ref={messagesEndRef} />
```

### How to Test
1. Upload an image
2. Type "Make it black and white" and press Enter
3. Verify: User message appears in chat
4. Verify: Loading spinner shows on send button
5. Verify: After ~10-30 seconds, new version appears in strip
6. Verify: New version is auto-selected
7. Verify: Assistant message "Afbeelding gegenereerd" appears
8. Verify: Can click original thumbnail to compare
9. Verify: Can type another prompt to iterate

---

## Phase 7: Save to Library

### Goal
Add header action to save the current version to Vercel Blob storage.

### Files to Modify
- `/src/app/admin/content/image-studio/page.tsx`

### Files to Add Strings
- `/src/config/strings.ts`:
  - `buttons.saveToLibrary: "Bewaren in bibliotheek"`

### Implementation Details

```tsx
// Add imports
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";

// Add state and router
const router = useRouter();
const [saving, setSaving] = useState(false);

// Save function
const saveToLibrary = async () => {
  if (!currentVersion || saving) return;

  setSaving(true);
  try {
    // Convert base64 to blob
    const response = await fetch(currentVersion.base64);
    const blob = await response.blob();

    // Create file with timestamp name
    const extension = currentVersion.mimeType.split("/")[1] || "png";
    const filename = `ai-studio-${Date.now()}.${extension}`;
    const file = new File([blob], filename, { type: currentVersion.mimeType });

    // Upload to Vercel Blob
    const result = await upload(filename, file, {
      access: "public",
      handleUploadUrl: "/api/admin/content/images/upload",
    });

    toast.success(t("admin.messages.imageSaved"));
    router.push(`/admin/content/media/${encodeURIComponent(result.url)}`);
  } catch (error) {
    console.error("Save failed:", error);
    toast.error(t("admin.messages.imageSaveFailed"));
  } finally {
    setSaving(false);
  }
};

// Header actions
const headerActions = useMemo(
  () => (
    <Button
      size="sm"
      onClick={saveToLibrary}
      disabled={versions.length === 0 || saving}
    >
      {saving ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          {t("admin.loading.saving")}
        </>
      ) : (
        <>
          <SaveIcon className="size-4" />
          {t("admin.buttons.saveToLibrary")}
        </>
      )}
    </Button>
  ),
  [versions.length, saving, currentVersion]
);

useAdminHeaderActions(headerActions);
```

### How to Test
1. Upload an image
2. Generate at least one edit
3. Click "Bewaren in bibliotheek" button in header
4. Verify: Button shows loading state
5. Verify: Redirected to media detail page
6. Verify: Image appears in media library
7. Verify: Can navigate back to Image Studio (state is cleared)

---

## Phase 8: Polish & Reset

### Goal
Add reset functionality, confirmation dialogs, and final polish.

### Files to Modify
- `/src/app/admin/content/image-studio/page.tsx`
- `/src/config/strings.ts`

### Files to Add Strings
- `/src/config/strings.ts`:
  - `buttons.new: "Nieuw"`
  - `headings.unsavedChanges: "Niet-opgeslagen wijzigingen"`
  - `dialogs.unsavedVersionsDesc: "Je hebt onopgeslagen versies. Weet je zeker dat je opnieuw wilt beginnen?"`

### Implementation Details

```tsx
// Add imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusIcon } from "lucide-react";

// Add state
const [showResetDialog, setShowResetDialog] = useState(false);

// Has unsaved changes (more than just original)
const hasUnsavedChanges = versions.length > 1;

// Reset function
const handleReset = () => {
  if (hasUnsavedChanges) {
    setShowResetDialog(true);
  } else {
    doReset();
  }
};

const doReset = () => {
  setVersions([]);
  setCurrentVersionIndex(0);
  setMessages([]);
  setInput("");
  setShowResetDialog(false);
};

// Update header actions to include New button
const headerActions = useMemo(
  () => (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleReset}
        disabled={versions.length === 0}
      >
        <PlusIcon className="size-4" />
        {t("admin.buttons.new")}
      </Button>
      <Button
        size="sm"
        onClick={saveToLibrary}
        disabled={versions.length === 0 || saving}
      >
        {saving ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {t("admin.loading.saving")}
          </>
        ) : (
          <>
            <SaveIcon className="size-4" />
            {t("admin.buttons.saveToLibrary")}
          </>
        )}
      </Button>
    </div>
  ),
  [versions.length, saving, hasUnsavedChanges]
);

// Reset confirmation dialog (add to JSX)
<AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t("admin.headings.unsavedChanges")}</AlertDialogTitle>
      <AlertDialogDescription>
        {t("admin.dialogs.unsavedVersionsDesc")}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t("admin.buttons.cancel")}</AlertDialogCancel>
      <AlertDialogAction onClick={doReset}>
        {t("admin.buttons.confirm")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Final Strings Checklist
Ensure all these strings are added to `/src/config/strings.ts` (all values in Dutch):

```typescript
// admin.nav
imageStudio: "Image Studio",  // Feature name, kept in English

// admin.headings
imageStudio: "Image Studio",
unsavedChanges: "Niet-opgeslagen wijzigingen",

// admin.labels
model: "Model",
version: "Versie",
versions: "Versies",

// admin.placeholders
describeEdit: "Beschrijf je wijziging...",

// admin.buttons
saveToLibrary: "Bewaren in bibliotheek",
new: "Nieuw",

// admin.misc
startWithImage: "Upload eerst een afbeelding om te beginnen",
originalImage: "Origineel",
modelFast: "Snel",
modelStandard: "Standaard",
modelBest: "Beste kwaliteit",

// admin.messages
imageGenerated: "Afbeelding gegenereerd",
imageGenerateFailed: "Kon afbeelding niet genereren",

// admin.dialogs
unsavedVersionsDesc: "Je hebt onopgeslagen versies. Weet je zeker dat je opnieuw wilt beginnen?",

// admin.empty
noImageYet: "Nog geen afbeelding",
noImageYetDesc: "Upload een afbeelding of selecteer er één uit de bibliotheek om te beginnen.",
```

**Note:** Existing strings to reuse:
- `admin.buttons.upload` = "Upload"
- `admin.buttons.library` = "Bibliotheek"
- `admin.buttons.cancel` = "Annuleren"
- `admin.buttons.confirm` = "Bevestigen"
- `admin.loading.saving` = "Bewaren..."
- `admin.loading.generating` = "Genereren..."
- `admin.messages.imageSaved` = "Afbeelding opgeslagen"
- `admin.messages.imageSaveFailed` = "Kon afbeelding niet opslaan"
- `admin.messages.imageLoadFailed` = "Kon afbeelding niet ophalen"
- `admin.messages.fileMustBeImage` = "Bestand moet een afbeelding zijn"

### How to Test
1. Upload image and generate 2-3 versions
2. Click "Nieuw" button
3. Verify: Confirmation dialog appears
4. Click Cancel - nothing changes
5. Click Confirm - all state resets, back to drop zone
6. Upload fresh image - clean state
7. With only original (no edits), click "Nieuw" - no dialog, instant reset
8. Full end-to-end test:
   - Upload image
   - Generate 2 edits with different prompts
   - Switch between versions
   - Save to library
   - Verify in media library
   - Return to Image Studio - clean state

---

## Notes

### Dependencies
- `@vercel/blob` - Already installed for media uploads
- `ai` and `@ai-sdk/openai` - Already installed for chatbot
- `nanoid` or `crypto.randomUUID()` - For generating IDs

### Environment Variables
Ensure `OPENAI_API_KEY` is set (already used by chatbot).

### Cost Considerations
- `gpt-image-1-mini`: Cheapest, good for testing
- `gpt-image-1`: Standard pricing
- `gpt-image-1.5-2025-12-16`: Most expensive, best quality

Consider adding usage tracking or warnings for cost awareness.
