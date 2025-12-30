"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
} from "@/components/ui/item";
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { t } from "@/config/strings";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface ImageValue {
  url: string;
  alt?: string;
}

interface ImageUploadProps {
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFromLibrary = (url: string) => {
    onChange({ url });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      // Trigger alt text generation in background
      fetch("/api/admin/content/images/generate-alt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, fileName: file.name }),
      });

      onChange({ url: blob.url });
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

  if (value?.url) {
    return (
      <Item
        variant="muted"
        size="sm"
        className="p-2 bg-white border border-border"
      >
        <ItemMedia variant="image" className="relative size-12">
          <Image
            src={value.url}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        </ItemMedia>
        <ItemContent>
          <span className="text-sm truncate max-w-[200px]">
            {value.url.split("/").pop()}
          </span>
        </ItemContent>
        <ItemActions>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-destructive"
            onClick={handleRemove}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </ItemActions>
      </Item>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          {uploading ? "Uploaden..." : "Upload"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setLibraryOpen(true)}
        >
          <ImageIcon className="size-4" />
          Bibliotheek
        </Button>
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
