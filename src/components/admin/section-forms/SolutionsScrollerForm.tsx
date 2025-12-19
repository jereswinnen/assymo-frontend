"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SolutionsScrollerSection } from "@/types/sections";

interface SolutionsScrollerFormProps {
  section: SolutionsScrollerSection;
  onChange: (section: SolutionsScrollerSection) => void;
}

export function SolutionsScrollerForm({
  section,
  onChange,
}: SolutionsScrollerFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Heading</Label>
        <Input
          id="heading"
          value={section.heading || ""}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Onze realisaties"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitel</Label>
        <Input
          id="subtitle"
          value={section.subtitle || ""}
          onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
          placeholder="Bekijk onze projecten"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Deze sectie toont automatisch alle realisaties in een horizontale
        scroller.
      </p>
    </div>
  );
}
