"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { IconSelect } from "@/components/admin/IconSelect";
import { FlexTextBlock } from "@/types/sections";

interface FlexTextBlockFormProps {
  block: FlexTextBlock;
  onChange: (block: FlexTextBlock) => void;
}

export function FlexTextBlockForm({ block, onChange }: FlexTextBlockFormProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Heading</Label>
          <Input
            value={block.heading || ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder="Optionele heading"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Heading niveau</Label>
          <Select
            value={block.headingLevel || "h2"}
            onValueChange={(value) =>
              onChange({ ...block, headingLevel: value as "h2" | "h3" | "h4" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
              <SelectItem value="h4">H4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <RichTextEditor
        label="Tekst"
        value={block.text || ""}
        onChange={(value) => onChange({ ...block, text: value })}
      />

      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs font-medium">Knop (optioneel)</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={block.button?.label || ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  button: { ...block.button, label: e.target.value },
                })
              }
              placeholder="Knop tekst"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              value={block.button?.url || ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  button: { ...block.button, url: e.target.value },
                })
              }
              placeholder="/contact"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Icoon</Label>
            <IconSelect
              value={block.button?.icon || ""}
              onValueChange={(value) =>
                onChange({
                  ...block,
                  button: { ...block.button, icon: value || undefined },
                })
              }
              allowNone
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Variant</Label>
            <Select
              value={block.button?.variant || "primary"}
              onValueChange={(value) =>
                onChange({
                  ...block,
                  button: {
                    ...block.button,
                    variant: value as "primary" | "secondary",
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
