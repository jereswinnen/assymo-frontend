"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlexFormBlock } from "@/types/sections";

interface FlexFormBlockFormProps {
  block: FlexFormBlock;
  onChange: (block: FlexFormBlock) => void;
}

export function FlexFormBlockForm({
  block,
  onChange,
}: FlexFormBlockFormProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Dit blok toont het contactformulier met een optionele titel en subtitel.
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Titel</Label>
        <Input
          value={block.title || ""}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Formulier titel"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Subtitel</Label>
        <Input
          value={block.subtitle || ""}
          onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
          placeholder="Optionele subtitel"
        />
      </div>
    </div>
  );
}
