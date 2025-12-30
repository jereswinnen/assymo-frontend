"use client";

import { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DraggableImageProps {
  id: string;
  url: string;
  children: ReactNode;
}

export function DraggableImage({ id, url, children }: DraggableImageProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "image", url },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none",
        isDragging && "opacity-50 cursor-grabbing"
      )}
    >
      {children}
    </div>
  );
}
