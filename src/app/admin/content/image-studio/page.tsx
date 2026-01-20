"use client";

import { useRef, useState } from "react";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { ArrowUpIcon, ImageIcon, Loader2Icon, UploadIcon } from "lucide-react";
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

  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-image-1");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentVersion = versions[currentVersionIndex] ?? null;
  const hasImage = versions.length > 0;

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

  const handleSubmit = () => {
    if (!input.trim() || !hasImage) return;
    // Will be implemented in Phase 6
    console.log("Submit:", input, selectedModel);
    setInput("");
  };

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentVersion.base64}
                  alt=""
                  className="h-full w-full object-contain"
                />
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
        </div>

        {/* Right: Chat sidebar */}
        <div className="bg-muted rounded-lg p-4 flex flex-col h-full">
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
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton variant="ghost">
                      {selectedModel === "gpt-image-1-mini" && t("admin.misc.modelFast")}
                      {selectedModel === "gpt-image-1" && t("admin.misc.modelStandard")}
                      {selectedModel === "gpt-image-1.5-2025-12-16" && t("admin.misc.modelBest")}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start">
                    <DropdownMenuItem onClick={() => setSelectedModel("gpt-image-1-mini")}>
                      {t("admin.misc.modelFast")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedModel("gpt-image-1")}>
                      {t("admin.misc.modelStandard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedModel("gpt-image-1.5-2025-12-16")}>
                      {t("admin.misc.modelBest")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  className="cursor-pointer rounded-full ml-auto"
                  size="icon-xs"
                  disabled={!input.trim() || !hasImage}
                >
                  <ArrowUpIcon />
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
