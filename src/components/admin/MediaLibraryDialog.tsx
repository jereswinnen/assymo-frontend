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
import { Loader2Icon, SearchIcon } from "lucide-react";
import type { MediaItem } from "@/app/api/admin/content/media/route";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/content/media");
        if (response.ok) {
          const data = await response.json();
          setImages(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
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

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecteer afbeelding</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Zoeken op naam of alt tekst..."
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
          ) : filteredImages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {search
                ? "Geen resultaten gevonden"
                : "Geen afbeeldingen in bibliotheek"}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-2">
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
