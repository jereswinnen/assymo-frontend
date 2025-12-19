"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SplitSectionSection, SplitSectionItem } from "@/types/sections";

const ICON_OPTIONS = [
  { label: "Geen", value: "" },
  { label: "Arrow", value: "arrow" },
  { label: "Calendar", value: "calendar" },
  { label: "Chat", value: "chat" },
  { label: "Download", value: "download" },
  { label: "Eye", value: "eye" },
  { label: "Hard Hat", value: "hardhat" },
  { label: "Info", value: "info" },
  { label: "Leaf", value: "leaf" },
  { label: "List", value: "list" },
  { label: "Mail", value: "mail" },
  { label: "Phone", value: "phone" },
  { label: "Ruler", value: "ruler" },
  { label: "Warehouse", value: "warehouse" },
];

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
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs mb-2 block">Afbeelding</Label>
          <ImageUpload
            value={item.image || null}
            onChange={(value) => updateItem(index, { image: value || undefined })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Titel</Label>
          <Input
            value={item.title || ""}
            onChange={(e) => updateItem(index, { title: e.target.value })}
            placeholder="Item titel"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Subtitel</Label>
          <Input
            value={item.subtitle || ""}
            onChange={(e) => updateItem(index, { subtitle: e.target.value })}
            placeholder="Optionele subtitel"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Link URL</Label>
          <Input
            value={item.href || ""}
            onChange={(e) => updateItem(index, { href: e.target.value })}
            placeholder="/pagina"
          />
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-medium">Actie knop (optioneel)</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={item.action?.label || ""}
                onChange={(e) =>
                  updateItem(index, {
                    action: { ...item.action, label: e.target.value },
                  })
                }
                placeholder="Bekijk meer"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Icoon</Label>
              <Select
                value={item.action?.icon || ""}
                onValueChange={(value) =>
                  updateItem(index, {
                    action: { ...item.action, icon: value || undefined },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies icoon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value || "none"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Variant</Label>
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
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Split Section toont twee items naast elkaar op desktop.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {renderItemForm(items[0], 0)}
        {renderItemForm(items[1], 1)}
      </div>
    </div>
  );
}
