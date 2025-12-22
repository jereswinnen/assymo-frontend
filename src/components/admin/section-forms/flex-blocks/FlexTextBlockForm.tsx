"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { IconSelect } from "@/components/admin/IconSelect";
import { Separator } from "@/components/ui/separator";
import { FlexTextBlock } from "@/types/sections";

interface FlexTextBlockFormProps {
  block: FlexTextBlock;
  onChange: (block: FlexTextBlock) => void;
}

export function FlexTextBlockForm({ block, onChange }: FlexTextBlockFormProps) {
  return (
    <FieldGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Heading</FieldLabel>
          <Input
            value={block.heading || ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder="Optionele heading"
          />
        </Field>
        <Field>
          <FieldLabel>Heading niveau</FieldLabel>
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
        </Field>
      </div>

      <RichTextEditor
        label="Tekst"
        value={block.text || ""}
        onChange={(value) => onChange({ ...block, text: value })}
      />

      <Separator />

      <Field orientation="horizontal">
        <FieldLabel>Knop</FieldLabel>
        <Switch
          checked={!!block.button}
          onCheckedChange={(checked) => {
            if (!checked) {
              onChange({ ...block, button: undefined });
            } else {
              onChange({ ...block, button: { label: "", url: "" } });
            }
          }}
        />
      </Field>

      {block.button && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Label</FieldLabel>
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
            </Field>
            <Field>
              <FieldLabel>URL</FieldLabel>
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
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Icoon</FieldLabel>
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
            </Field>
            <Field>
              <FieldLabel>Variant</FieldLabel>
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
                  <SelectItem value="primary">Primair</SelectItem>
                  <SelectItem value="secondary">Secundair</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      )}
    </FieldGroup>
  );
}
