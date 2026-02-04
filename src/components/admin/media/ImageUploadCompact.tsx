"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { t } from "@/config/strings";
import { useSiteContext } from "@/lib/permissions/site-context";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface ImageUploadCompactProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploadCompact({ value, onChange }: ImageUploadCompactProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentSite } = useSiteContext();

  const handleSelectFromLibrary = (url: string) => {
    onChange(url);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentSite?.id) {
      toast.error("Site niet geladen. Ververs de pagina.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.messages.fileMustBeImage"));
      return;
    }

    // Validate file size (max 25MB)
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("admin.messages.imageMaxSize"));
      return;
    }

    setUploading(true);
    try {
      // Upload directly to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/content/images/upload",
      });

      // Trigger metadata creation and alt text generation
      const response = await fetch("/api/admin/content/images/generate-alt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: blob.url,
          fileName: file.name,
          siteId: currentSite.id,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create image metadata:", await response.text());
      }

      onChange(blob.url);
      toast.success(t("admin.messages.imageUploaded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.messages.uploadFailed"));
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {/* Thumbnail area */}
        <div className="relative size-12 shrink-0 rounded border bg-muted overflow-hidden">
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex items-center justify-center size-full">
              <ImageIcon className="size-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <XIcon className="size-4" />
              {t("admin.buttons.delete")}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <UploadIcon className="size-4" />
                )}
                {uploading ? t("admin.loading.uploading") : t("admin.buttons.upload")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setLibraryOpen(true)}
              >
                <ImageIcon className="size-4" />
                {t("admin.buttons.library")}
              </Button>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleSelectFromLibrary}
      />
    </>
  );
}
