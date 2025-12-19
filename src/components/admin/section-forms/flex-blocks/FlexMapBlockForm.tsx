"use client";

import { MapPinIcon } from "lucide-react";
import { FlexMapBlock } from "@/types/sections";

interface FlexMapBlockFormProps {
  block: FlexMapBlock;
  onChange: (block: FlexMapBlock) => void;
}

export function FlexMapBlockForm({ block, onChange }: FlexMapBlockFormProps) {
  return (
    <div className="flex items-center gap-3 py-2 text-muted-foreground">
      <MapPinIcon className="size-5" />
      <p className="text-sm">
        Dit blok toont automatisch de Google Maps kaart met de bedrijfslocatie.
      </p>
    </div>
  );
}
