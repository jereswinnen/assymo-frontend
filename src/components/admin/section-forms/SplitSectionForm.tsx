"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { IconSelect } from "@/components/admin/IconSelect";
import { SplitSectionSection, SplitSectionItem } from "@/types/sections";

interface SplitSectionFormProps {
  section: SplitSectionSection;
  onChange: (section: SplitSectionSection) => void;
}

export function SplitSectionForm({
  section,
  onChange,
}: SplitSectionFormProps) {
  // Ensure we always have exactly 2 items
  const items: [SplitSectionItem, SplitSectionItem] = section.items || [
    { _key: crypto.randomUUID() },
    { _key: crypto.randomUUID() },
  ];

  const updateItem = (index: 0 | 1, updates: Partial<SplitSectionItem>) => {
    const newItems: [SplitSectionItem, SplitSectionItem] = [...items] as [
      SplitSectionItem,
      SplitSectionItem
    ];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...section, items: newItems });
  };

  const renderItemForm = (item: SplitSectionItem, index: 0 | 1) => (
    <Card key={item._key}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Item {index + 1}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Afbeelding</FieldLabel>
            <ImageUpload
              value={item.image || null}
              onChange={(value) => updateItem(index, { image: value || undefined })}
            />
          </Field>

          <Field>
            <FieldLabel>Titel</FieldLabel>
            <Input
              value={item.title || ""}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              placeholder="Item titel"
            />
          </Field>

          <Field>
            <FieldLabel>Subtitel</FieldLabel>
            <Input
              value={item.subtitle || ""}
              onChange={(e) => updateItem(index, { subtitle: e.target.value })}
              placeholder="Optionele subtitel"
            />
          </Field>

          <Field>
            <FieldLabel>Link URL</FieldLabel>
            <Input
              value={item.href || ""}
              onChange={(e) => updateItem(index, { href: e.target.value })}
              placeholder="/pagina"
            />
          </Field>

          <div className="space-y-3 pt-2 border-t">
            <FieldLabel>Actie knop (optioneel)</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel className="text-muted-foreground">Label</FieldLabel>
                <Input
                  value={item.action?.label || ""}
                  onChange={(e) =>
                    updateItem(index, {
                      action: { ...item.action, label: e.target.value },
                    })
                  }
                  placeholder="Bekijk meer"
                />
              </Field>
              <Field>
                <FieldLabel className="text-muted-foreground">Icoon</FieldLabel>
                <IconSelect
                  value={item.action?.icon || ""}
                  onValueChange={(value) =>
                    updateItem(index, {
                      action: { ...item.action, icon: value || undefined },
                    })
                  }
                  allowNone
                />
              </Field>
              <Field>
                <FieldLabel className="text-muted-foreground">Variant</FieldLabel>
                <Select
                  value={item.action?.variant || "secondary"}
                  onValueChange={(value) =>
                    updateItem(index, {
                      action: {
                        ...item.action,
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
        </FieldGroup>
      </CardContent>
    </Card>
  );

  return (
    <FieldGroup>
      <FieldDescription>
        Split Section toont twee items naast elkaar op desktop.
      </FieldDescription>
      <div className="grid gap-4 lg:grid-cols-2">
        {renderItemForm(items[0], 0)}
        {renderItemForm(items[1], 1)}
      </div>
    </FieldGroup>
  );
}
