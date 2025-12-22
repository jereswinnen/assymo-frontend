"use client";

import { FieldDescription } from "@/components/ui/field";
import { MapPinIcon } from "lucide-react";
import { FlexMapBlock } from "@/types/sections";

interface FlexMapBlockFormProps {
  block: FlexMapBlock;
  onChange: (block: FlexMapBlock) => void;
}

export function FlexMapBlockForm({ block, onChange }: FlexMapBlockFormProps) {
  return (
    <FieldDescription>
      Dit blok toont automatisch de Google Maps kaart met de bedrijfslocatie.
    </FieldDescription>
  );
}
