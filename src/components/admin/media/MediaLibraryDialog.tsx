"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftIcon,
  FolderIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";
import type { MediaItem } from "@/app/api/admin/content/media/route";
import type { MediaFolder } from "@/app/api/admin/content/media/folders/route";
import { t } from "@/config/strings";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: MediaLibraryDialogProps) {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const folderParam = currentFolderId ? currentFolderId : "root";
        const [foldersRes, mediaRes] = await Promise.all([
          currentFolderId
            ? Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
            : fetch("/api/admin/content/media/folders"),
          fetch(`/api/admin/content/media?folderId=${folderParam}`),
        ]);

        if (foldersRes.ok && !currentFolderId) {
          setFolders(await foldersRes.json());
        }

        if (mediaRes.ok) {
          setImages(await mediaRes.json());
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, currentFolderId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setSearch("");
    }
  }, [open]);

  const filteredImages = images.filter((image) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      image.pathname.toLowerCase().includes(searchLower) ||
      image.displayName?.toLowerCase().includes(searchLower) ||
      image.altText?.toLowerCase().includes(searchLower)
    );
  });

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  const handleFolderClick = (folder: MediaFolder) => {
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
    setSearch("");
  };

  const handleBackClick = () => {
    setCurrentFolderId(null);
    setCurrentFolderName(null);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[70vw]! max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {currentFolderName ? currentFolderName : "Selecteer afbeelding"}
          </DialogTitle>
        </DialogHeader>

        {/* Back button when in folder */}
        {currentFolderId && (
          <button
            onClick={handleBackClick}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
          >
            <ArrowLeftIcon className="size-4" />
            <span>Terug</span>
          </button>
        )}

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.placeholders.searchAlt")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFolders.length === 0 && filteredImages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {search
                ? "Geen resultaten gevonden"
                : currentFolderId
                  ? "Deze map is leeg"
                  : "Geen afbeeldingen in bibliotheek"}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 py-2">
              {/* Folders first (only at root level) */}
              {!currentFolderId &&
                filteredFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleFolderClick(folder)}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted hover:border-primary hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {/* Preview grid */}
                    <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-0.5 rounded overflow-hidden">
                      {[0, 1, 2, 3].map((index) => {
                        const imageUrl = folder.previewImages[index];
                        return (
                          <div
                            key={index}
                            className="relative bg-muted-foreground/10 overflow-hidden"
                          >
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="60px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="size-3 rounded bg-muted-foreground/5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Folder icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="p-1.5 rounded-full bg-background/80 shadow-sm">
                        <FolderIcon className="size-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Info bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-4">
                      <p className="text-white text-xs truncate font-medium">
                        {folder.name}
                      </p>
                      <p className="text-white/70 text-xs">
                        {folder.itemCount}{" "}
                        {folder.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </button>
                ))}

              {/* Images */}
              {filteredImages.map((image) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => handleSelect(image.url)}
                  className="group relative aspect-square overflow-hidden rounded-lg border hover:border-primary hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Image
                    src={image.url}
                    alt={image.altText || ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 25vw"
                  />
                  {(image.displayName || image.altText) && (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">
                        {image.displayName || image.altText}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
