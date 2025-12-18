"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

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
      onChange({ url, alt: "" });
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
      <div className="space-y-3">
        {label && <Label>{label}</Label>}
        <div className="relative inline-block">
          <Image
            src={value.url}
            alt={value.alt || ""}
            width={300}
            height={200}
            className="rounded-lg border object-cover"
            style={{ maxHeight: "200px", width: "auto" }}
          />
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
        <div className="max-w-[300px]">
          <Label htmlFor="alt-text" className="text-sm">
            Alt tekst
          </Label>
          <Input
            id="alt-text"
            value={value.alt || ""}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Beschrijving van de afbeelding"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-8 hover:border-primary hover:bg-muted/50 transition-colors">
        {uploading ? (
          <>
            <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Uploaden...</span>
          </>
        ) : (
          <>
            <UploadIcon className="size-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Klik om afbeelding te uploaden
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
    </div>
  );
}
