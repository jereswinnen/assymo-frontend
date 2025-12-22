"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ImageIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { formatFileSize, formatDateShort } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";

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

  // Track items pending alt text generation
  const pendingAltTextUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchMedia();
  }, []);

  // Poll for alt text updates on items that don't have it yet
  const pollForAltText = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    // Wait 3 seconds before first poll
    await new Promise((resolve) => setTimeout(resolve, 3000));

    for (const url of urls) {
      try {
        const response = await fetch(
          `/api/admin/content/media/${encodeURIComponent(url)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.altText) {
            // Update the item in state
            setMedia((prev) =>
              prev.map((item) =>
                item.url === url ? { ...item, altText: data.altText } : item
              )
            );
            pendingAltTextUrls.current.delete(url);
          }
        }
      } catch {
        // Silently fail
      }
    }

    // If there are still pending items, poll again after 2 more seconds
    const stillPending = urls.filter((url) =>
      pendingAltTextUrls.current.has(url)
    );
    if (stillPending.length > 0) {
      setTimeout(() => pollForAltText(stillPending), 2000);
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

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedItems: MediaItem[] = [];
    let errorCount = 0;

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        errorCount++;
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errorCount++;
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/content/images/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const { url, filename } = await response.json();
          // Add to uploaded list with file info
          uploadedItems.push({
            url,
            pathname: filename,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            displayName: filename,
            altText: null, // Alt text generated in background
          });
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    // Reset input
    e.target.value = "";
    setUploading(false);

    // Add uploaded items to state (newest first)
    if (uploadedItems.length > 0) {
      setMedia((prev) => [...uploadedItems, ...prev]);
      toast.success(
        `${uploadedItems.length} afbeelding${uploadedItems.length > 1 ? "en" : ""} geupload`
      );

      // Track these URLs for polling
      const newUrls = uploadedItems.map((item) => item.url);
      newUrls.forEach((url) => pendingAltTextUrls.current.add(url));
      pollForAltText(newUrls);
    }
    if (errorCount > 0) {
      toast.error(
        `${errorCount} afbeelding${errorCount > 1 ? "en" : ""} mislukt`
      );
    }
  }, [pollForAltText]);

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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      setMedia((prev) => prev.filter((m) => m.url !== deleteTarget.url));
      toast.success("Afbeelding verwijderd");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kon afbeelding niet verwijderen");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
    [uploading, handleUpload]
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => {
            const name = item.displayName || item.pathname;
            return (
              <Card
                key={item.url}
                className="group overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              >
                <Link
                  href={`/admin/content/media/${encodeURIComponent(item.url)}`}
                  className="block"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={item.url}
                      alt={item.altText || name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
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
                        className="size-8"
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
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate" title={name}>
                      {name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)} • {formatDateShort(item.uploadedAt)}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
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
              Weet je zeker dat je &quot;{deleteTarget?.displayName || deleteTarget?.pathname}&quot; wilt
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
