"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { MediaLibraryDialog } from "./MediaLibraryDialog";

export interface ImageValue {
  url: string;
  alt?: string;
}

interface ImageUploadProps {
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleSelectFromLibrary = (url: string) => {
    onChange({ url });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Bestand moet een afbeelding zijn");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Afbeelding mag maximaal 10MB zijn");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/content/images/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      onChange({ url });
      toast.success("Afbeelding geupload");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload mislukt"
      );
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
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="relative w-fit">
          <div className="relative h-[200px] w-[300px] overflow-hidden rounded-lg border">
            <Image
              src={value.url}
              alt=""
              fill
              className="object-cover"
              sizes="300px"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 size-6"
            onClick={handleRemove}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex gap-3">
          <label className="flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-6 hover:border-primary hover:bg-muted/50 transition-colors">
            {uploading ? (
              <>
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Uploaden...</span>
              </>
            ) : (
              <>
                <UploadIcon className="size-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Upload nieuw
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, WebP (max. 10MB)
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <ImageIcon className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Kies uit bibliotheek
            </span>
          </button>
        </div>
      </div>
      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleSelectFromLibrary}
      />
    </>
  );
}
