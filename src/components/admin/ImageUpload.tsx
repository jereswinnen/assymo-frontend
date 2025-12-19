"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExternalLinkIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
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
  const [altText, setAltText] = useState<string | null>(null);
  const [loadingAlt, setLoadingAlt] = useState(false);

  // Fetch alt text from media library when URL changes
  useEffect(() => {
    if (!value?.url) {
      setAltText(null);
      return;
    }

    const fetchAltText = async () => {
      setLoadingAlt(true);
      try {
        const response = await fetch(
          `/api/admin/content/media/${encodeURIComponent(value.url)}`
        );
        if (response.ok) {
          const data = await response.json();
          setAltText(data.altText || null);
        }
      } catch {
        // Silently fail - alt text is optional
      } finally {
        setLoadingAlt(false);
      }
    };

    fetchAltText();
  }, [value?.url]);

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
      <div className="space-y-3">
        {label && <Label>{label}</Label>}
        <div className="relative w-fit">
          <div className="relative h-[200px] w-[300px] overflow-hidden rounded-lg border">
            <Image
              src={value.url}
              alt={altText || ""}
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
        <div className="max-w-[300px] space-y-1">
          <Label className="text-sm text-muted-foreground">Alt tekst</Label>
          {loadingAlt ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : altText ? (
            <p className="text-sm">{altText}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Geen alt tekst ingesteld
            </p>
          )}
          <Link
            href={`/admin/content/media/${encodeURIComponent(value.url)}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon className="size-3" />
            Bewerken in mediabibliotheek
          </Link>
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
