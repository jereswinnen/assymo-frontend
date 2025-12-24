"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  CloudUploadIcon,
  ImageIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { formatFileSize, formatDateShort } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface MediaItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  displayName: string | null;
  altText: string | null;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Track items pending alt text generation
  const pendingAltTextUrls = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const MAX_POLL_ATTEMPTS = 10;

  useEffect(() => {
    fetchMedia();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Poll for alt text updates on items that don't have it yet
  const pollForAltText = useCallback(async (urls: string[], attempt = 1) => {
    if (urls.length === 0 || !isMountedRef.current) return;

    // Wait 3 seconds before first poll, 2 seconds for subsequent
    const delay = attempt === 1 ? 3000 : 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (!isMountedRef.current) return;

    for (const url of urls) {
      try {
        const response = await fetch(
          `/api/admin/content/media/${encodeURIComponent(url)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.altText) {
            // Update the item in state
            setMedia((prev) =>
              prev.map((item) =>
                item.url === url ? { ...item, altText: data.altText } : item,
              ),
            );
            pendingAltTextUrls.current.delete(url);
          }
        }
      } catch {
        // Silently fail
      }
    }

    // If there are still pending items and we haven't exceeded max attempts, poll again
    const stillPending = urls.filter((url) =>
      pendingAltTextUrls.current.has(url),
    );
    if (
      stillPending.length > 0 &&
      attempt < MAX_POLL_ATTEMPTS &&
      isMountedRef.current
    ) {
      pollForAltText(stillPending, attempt + 1);
    } else if (stillPending.length > 0) {
      // Clear remaining pending URLs after max attempts
      stillPending.forEach((url) => pendingAltTextUrls.current.delete(url));
    }
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/media");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setMedia(data);
    } catch {
      toast.error("Kon media niet ophalen");
    } finally {
      setLoading(false);
    }
  };

  // Core upload function that can be called from input change or drag-drop
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setUploading(true);
      const uploadedItems: MediaItem[] = [];
      let errorCount = 0;

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          errorCount++;
          continue;
        }

        // Validate file size (max 25MB)
        if (file.size > MAX_FILE_SIZE) {
          errorCount++;
          continue;
        }

        try {
          // Upload directly to Vercel Blob
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/admin/content/images/client-upload",
          });

          // Trigger alt text generation in background
          fetch("/api/admin/content/images/generate-alt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: blob.url, fileName: file.name }),
          });

          uploadedItems.push({
            url: blob.url,
            pathname: blob.pathname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            displayName: file.name,
            altText: null,
          });
        } catch {
          errorCount++;
        }
      }

      setUploading(false);

      // Add uploaded items to state (newest first)
      if (uploadedItems.length > 0) {
        setMedia((prev) => [...uploadedItems, ...prev]);
        toast.success(
          `${uploadedItems.length} afbeelding${uploadedItems.length > 1 ? "en" : ""} geupload`,
        );

        // Track these URLs for polling
        const newUrls = uploadedItems.map((item) => item.url);
        newUrls.forEach((url) => pendingAltTextUrls.current.add(url));
        pollForAltText(newUrls);
      }
      if (errorCount > 0) {
        toast.error(
          `${errorCount} afbeelding${errorCount > 1 ? "en" : ""} mislukt`,
        );
      }
    },
    [pollForAltText],
  );

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      uploadFiles(Array.from(files));
      e.target.value = "";
    },
    [uploadFiles],
  );

  // Drag and drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounter.current++;
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        uploadFiles(Array.from(files));
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [uploadFiles]);

  const deleteMedia = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/admin/content/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: deleteTarget.url }),
      });

      const data = await response.json();

      // Close dialog first
      setDeleting(false);
      setDeleteTarget(null);

      if (!response.ok) {
        toast.error(data.error || "Kon afbeelding niet verwijderen");
        return;
      }

      setMedia((prev) => prev.filter((m) => m.url !== deleteTarget.url));
      toast.success("Afbeelding verwijderd");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleting(false);
      setDeleteTarget(null);
      toast.error("Kon afbeelding niet verwijderen");
    }
  };

  // Filter media by search query (search in displayName, pathname, and altText)
  const filteredMedia = media.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.pathname.toLowerCase().includes(query) ||
      item.displayName?.toLowerCase().includes(query) ||
      item.altText?.toLowerCase().includes(query)
    );
  });

  // Header actions
  const headerActions = useMemo(
    () => (
      <label>
        <Button size="sm" disabled={uploading} asChild>
          <span className="cursor-pointer">
            {uploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Uploaden...
              </>
            ) : (
              <>
                <UploadIcon className="size-4" />
                Upload
              </>
            )}
          </span>
        </Button>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    ),
    [uploading, handleUpload],
  );
  useAdminHeaderActions(headerActions);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Zoek op bestandsnaam..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Geen afbeeldingen gevonden"
                : "Nog geen afbeeldingen geupload"}
            </p>
            {!searchQuery && (
              <label>
                <Button size="sm" asChild>
                  <span className="cursor-pointer">
                    <UploadIcon className="size-4" />
                    Eerste afbeelding uploaden
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => {
            const name = item.displayName || item.pathname;
            return (
              <Link
                key={item.url}
                href={`/admin/content/media/${encodeURIComponent(item.url)}`}
                className="group relative aspect-square overflow-hidden rounded-lg shadow-sm transition-all duration-300 ease-in-out hover:scale-103 will-change-transform"
              >
                <Image
                  src={item.url}
                  alt={item.altText || name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
                {/* Alt text generating indicator */}
                {!item.altText && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    <Loader2Icon className="size-3 animate-spin" />
                    <span>Alt-tekst</span>
                  </div>
                )}
                {/* Delete button in top-right corner */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(item);
                    }}
                    title="Verwijderen"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
                {/* Overlay info at bottom */}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-3 pt-6">
                  <p
                    className="mb-1! text-xs font-medium text-white truncate"
                    title={name}
                  >
                    {name}
                  </p>
                  <p className="text-xs text-white/80">
                    {formatFileSize(item.size)} •{" "}
                    {formatDateShort(item.uploadedAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/80 animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-150">
            <CloudUploadIcon className="size-6 animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Laat los om te uploaden...
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afbeelding verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;
              {deleteTarget?.displayName || deleteTarget?.pathname}&quot; wilt
              verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMedia}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                "Verwijderen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
