"use client";

import { useRef, useState } from "react";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { ImageIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { MediaLibraryDialog } from "@/components/admin/media/MediaLibraryDialog";
import { t } from "@/config/strings";
import { toast } from "sonner";

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
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function ImageStudioPage() {
  const { authorized, loading } = useRequireFeature("media");

  const [imageData, setImageData] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.messages.fileMustBeImage"));
      return;
    }

    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      setImageData(base64);
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
      const base64 = await urlToBase64(url);
      setImageData(base64);
    } catch {
      toast.error(t("admin.messages.imageLoadFailed"));
    } finally {
      setIsLoading(false);
    }
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
    <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
        {/* Left: Image viewer */}
        <div className="md:col-span-2 min-h-0">
          {isLoading ? (
            <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : imageData ? (
            <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageData}
                alt=""
                className="max-h-full max-w-full object-contain"
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

        {/* Right: Chat sidebar placeholder */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground">Chat sidebar (Fase 4)</p>
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
