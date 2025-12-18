"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  CopyIcon,
  ImageIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

interface BlobItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MediaPage() {
  const [blobs, setBlobs] = useState<BlobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BlobItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/media");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setBlobs(data);
    } catch {
      toast.error("Kon media niet ophalen");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedBlobs: BlobItem[] = [];
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
          uploadedBlobs.push({
            url,
            pathname: filename,
            size: file.size,
            uploadedAt: new Date().toISOString(),
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

    // Add uploaded blobs to state (newest first)
    if (uploadedBlobs.length > 0) {
      setBlobs((prev) => [...uploadedBlobs, ...prev]);
      toast.success(
        `${uploadedBlobs.length} afbeelding${uploadedBlobs.length > 1 ? "en" : ""} geupload`
      );
    }
    if (errorCount > 0) {
      toast.error(
        `${errorCount} afbeelding${errorCount > 1 ? "en" : ""} mislukt`
      );
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL gekopieerd");
    } catch {
      toast.error("Kon URL niet kopieren");
    }
  };

  const deleteMedia = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/admin/content/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: deleteTarget.url }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      setBlobs((prev) => prev.filter((b) => b.url !== deleteTarget.url));
      setDeleteTarget(null);
      toast.success("Afbeelding verwijderd");
    } catch {
      toast.error("Kon afbeelding niet verwijderen");
    } finally {
      setDeleting(false);
    }
  };

  // Filter blobs by search query
  const filteredBlobs = blobs.filter((blob) =>
    blob.pathname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Media</h1>
          <p className="text-sm text-muted-foreground">
            Beheer afbeeldingen en bestanden
          </p>
        </div>
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
      </header>

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
      ) : filteredBlobs.length === 0 ? (
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
          {filteredBlobs.map((blob) => (
            <Card
              key={blob.url}
              className="group overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            >
              <div className="relative aspect-square">
                <Image
                  src={blob.url}
                  alt={blob.pathname}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => copyUrl(blob.url)}
                    title="Kopieer URL"
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => setDeleteTarget(blob)}
                    title="Verwijderen"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p
                  className="text-xs font-medium truncate"
                  title={blob.pathname}
                >
                  {blob.pathname}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(blob.size)} • {formatDate(blob.uploadedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
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
              Weet je zeker dat je &quot;{deleteTarget?.pathname}&quot; wilt
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
