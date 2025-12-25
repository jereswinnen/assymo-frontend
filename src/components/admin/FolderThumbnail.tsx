"use client";

import Image from "next/image";
import { FolderIcon } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface FolderThumbnailProps {
  id: string;
  name: string;
  itemCount: number;
  previewImages: string[];
  onClick: () => void;
}

export function FolderThumbnail({
  id,
  name,
  itemCount,
  previewImages,
  onClick,
}: FolderThumbnailProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: { type: "folder", folderId: id },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg bg-muted transition-all duration-200",
        "hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
        isOver && "ring-2 ring-primary bg-primary/10 scale-105"
      )}
    >
      {/* Preview grid */}
      <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-1 rounded overflow-hidden">
        {[0, 1, 2, 3].map((index) => {
          const imageUrl = previewImages[index];
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
                  sizes="80px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-4 rounded bg-muted-foreground/5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Folder icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={cn(
            "p-2 rounded-full bg-background/80 shadow-sm transition-transform",
            "group-hover:scale-110",
            isOver && "scale-110 bg-primary/20"
          )}
        >
          <FolderIcon
            className={cn(
              "size-6 text-muted-foreground",
              isOver && "text-primary"
            )}
          />
        </div>
      </div>

      {/* Info bar */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-3 pt-6">
        <p className="mb-1! text-xs font-medium text-white truncate">{name}</p>
        <p className="text-xs text-white/80">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-primary border-dashed rounded-lg pointer-events-none" />
      )}
    </button>
  );
}
