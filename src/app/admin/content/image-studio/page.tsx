"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import {
  ArrowUpIcon,
  ImageIcon,
  Loader2Icon,
  MessagesSquareIcon,
  SaveIcon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaLibraryDialog } from "@/components/admin/media/MediaLibraryDialog";
import { t } from "@/config/strings";
import { toast } from "sonner";

interface ImageVersion {
  id: string;
  base64: string;
  mimeType: string;
  prompt: string;
  timestamp: Date;
  isOriginal: boolean;
  isPending?: boolean;
  sourceBase64?: string; // The source image shown blurred while pending
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  versionId?: string;
}

// Convert File to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert URL to base64 (for media library selection)
const urlToBase64 = async (
  url: string,
): Promise<{ base64: string; mimeType: string }> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        base64: reader.result as string,
        mimeType: blob.type,
      });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function ImageStudioPage() {
  const { authorized, loading } = useRequireFeature("media");
  const router = useRouter();

  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-image-1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentVersion = versions[currentVersionIndex] ?? null;
  const hasImage = versions.length > 0;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createOriginalVersion = (
    base64: string,
    mimeType: string,
  ): ImageVersion => ({
    id: crypto.randomUUID(),
    base64,
    mimeType,
    prompt: t("admin.misc.originalImage"),
    timestamp: new Date(),
    isOriginal: true,
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.messages.fileMustBeImage"));
      return;
    }

    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const version = createOriginalVersion(base64, file.type);
      setVersions([version]);
      setCurrentVersionIndex(0);
    } catch {
      toast.error(t("admin.messages.imageLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
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
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleLibrarySelect = async (url: string) => {
    setIsLoading(true);
    try {
      const { base64, mimeType } = await urlToBase64(url);
      const version = createOriginalVersion(base64, mimeType);
      setVersions([version]);
      setCurrentVersionIndex(0);
    } catch {
      toast.error(t("admin.messages.imageLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !hasImage || isGenerating || !currentVersion) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Create pending version immediately (shows blurred source while generating)
    const pendingVersionId = crypto.randomUUID();
    const pendingVersion: ImageVersion = {
      id: pendingVersionId,
      base64: "", // Will be filled when generation completes
      mimeType: currentVersion.mimeType,
      prompt: userMessage.content,
      timestamp: new Date(),
      isOriginal: false,
      isPending: true,
      sourceBase64: currentVersion.base64, // Source image to show blurred
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    // Add pending version and select it
    setVersions((prev) => [...prev, pendingVersion]);
    setCurrentVersionIndex(versions.length); // Select the new pending version

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

      // Update the pending version with actual data
      setVersions((prev) =>
        prev.map((v) =>
          v.id === pendingVersionId
            ? {
                ...v,
                base64: data.base64,
                mimeType: data.mimeType,
                isPending: false,
                sourceBase64: undefined,
              }
            : v
        )
      );

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t("admin.messages.imageGenerated"),
        timestamp: new Date(),
        versionId: pendingVersionId,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      toast.success(t("admin.messages.imageGenerated"));
    } catch (error) {
      console.error("Generation failed:", error);

      // Remove the failed pending version
      setVersions((prev) => prev.filter((v) => v.id !== pendingVersionId));
      setCurrentVersionIndex((prev) => Math.max(0, prev - 1));

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

  // Save current version to media library
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [versions.length, saving]
  );

  useAdminHeaderActions(headerActions);

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
    <div className="h-[calc(100vh-(--spacing(16))-(--spacing(8)))] flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
        {/* Left: Image viewer */}
        <div className="md:col-span-2 min-h-0 flex flex-col gap-4">
          {/* Main image area */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
                <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : currentVersion ? (
              <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
                {currentVersion.isPending ? (
                  <>
                    {/* Blurred source image while generating */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentVersion.sourceBase64}
                      alt=""
                      className="h-full w-full object-contain blur-md scale-105 opacity-60"
                    />
                    {/* Spinner overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-background/80 rounded-full p-4">
                        <Loader2Icon className="size-8 animate-spin text-primary" />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Completed image with fade-in animation */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={currentVersion.id}
                    src={currentVersion.base64}
                    alt=""
                    className="h-full w-full object-contain animate-in fade-in duration-1000"
                  />
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`h-full w-full rounded-lg bg-muted transition-all ${
                  isDragging ? "ring-2 ring-primary ring-dashed" : ""
                }`}
              >
                <Empty className="h-full border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ImageIcon />
                    </EmptyMedia>
                    <EmptyTitle>{t("admin.empty.noImageYet")}</EmptyTitle>
                    <EmptyDescription>
                      {t("admin.empty.noImageYetDesc")}
                    </EmptyDescription>
                  </EmptyHeader>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon className="size-4" />
                      {t("admin.buttons.upload")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMediaLibrary(true)}
                    >
                      <ImageIcon className="size-4" />
                      {t("admin.buttons.library")}
                    </Button>
                  </div>
                </Empty>
              </div>
            )}
          </div>

          {/* Version thumbnails strip */}
          {versions.length > 0 && (
            <div className="flex gap-2 overflow-x-visible">
              {versions.map((version, index) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setCurrentVersionIndex(index)}
                  className={`relative shrink-0 size-16 rounded-md overflow-hidden transition-all ${
                    index === currentVersionIndex
                      ? "outline-2 outline-offset-2 outline-primary"
                      : "hover:outline-2 hover:outline-offset-2 hover:outline-muted-foreground/50"
                  }`}
                >
                  {version.isPending ? (
                    <>
                      {/* Blurred source image for pending thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={version.sourceBase64}
                        alt={version.prompt}
                        className="size-full object-cover blur-sm opacity-60"
                      />
                      {/* Spinner overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                      </div>
                    </>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={version.base64}
                      alt={version.prompt}
                      className="size-full object-cover"
                    />
                  )}
                  {version.isOriginal && (
                    <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/60 text-white px-1 truncate">
                      {t("admin.misc.originalImage")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Chat sidebar */}
        <div className="bg-muted rounded-lg p-4 flex flex-col h-full">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.length === 0 && (
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessagesSquareIcon />
                  </EmptyMedia>
                  <EmptyDescription>
                    {hasImage
                      ? t("admin.placeholders.describeEdit")
                      : t("admin.misc.startWithImage")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <InputGroup className="bg-white">
              <InputGroupTextarea
                ref={textareaRef}
                placeholder={t("admin.placeholders.describeEdit")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={!hasImage || isGenerating}
              />
              <InputGroupAddon align="block-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isGenerating}>
                    <InputGroupButton variant="secondary" disabled={isGenerating}>
                      {selectedModel === "gpt-image-1-mini" &&
                        t("admin.misc.modelFast")}
                      {selectedModel === "gpt-image-1" &&
                        t("admin.misc.modelStandard")}
                      {selectedModel === "gpt-image-1.5" &&
                        t("admin.misc.modelBest")}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start">
                    <DropdownMenuItem
                      onClick={() => setSelectedModel("gpt-image-1-mini")}
                    >
                      {t("admin.misc.modelFast")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedModel("gpt-image-1")}
                    >
                      {t("admin.misc.modelStandard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setSelectedModel("gpt-image-1.5")
                      }
                    >
                      {t("admin.misc.modelBest")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  className="cursor-pointer rounded-full ml-auto"
                  size="icon-xs"
                  disabled={!input.trim() || !hasImage || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <ArrowUpIcon />
                  )}
                  <span className="sr-only">{t("admin.buttons.send")}</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Media Library Dialog */}
      <MediaLibraryDialog
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleLibrarySelect}
      />
    </div>
  );
}
