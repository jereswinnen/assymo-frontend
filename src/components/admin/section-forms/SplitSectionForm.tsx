"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { ImageUpload } from "@/components/admin/media/ImageUpload";
import { IconSelect } from "@/components/admin/IconSelect";
import { Separator } from "@/components/ui/separator";
import { SplitSectionSection, SplitSectionItem } from "@/types/sections";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface SplitSectionFormProps {
  section: SplitSectionSection;
  onChange: (section: SplitSectionSection) => void;
}

export function SplitSectionForm({ section, onChange }: SplitSectionFormProps) {
  const { currentSite } = useSiteContext();

  // Ensure we always have exactly 2 items
  const items: [SplitSectionItem, SplitSectionItem] = section.items || [
    { _key: crypto.randomUUID() },
    { _key: crypto.randomUUID() },
  ];

  const updateItem = (index: 0 | 1, updates: Partial<SplitSectionItem>) => {
    const newItems: [SplitSectionItem, SplitSectionItem] = [...items] as [
      SplitSectionItem,
      SplitSectionItem,
    ];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...section, items: newItems });
  };

  const renderItemForm = (item: SplitSectionItem, index: 0 | 1) => (
    <div key={item._key} className="space-y-3">
      <FieldLabel className="font-medium">Item {index + 1}</FieldLabel>
      <div className="p-4 space-y-4 border rounded-lg">
        <Field>
          <FieldLabel>Afbeelding</FieldLabel>
          <ImageUpload
            value={item.image || null}
            onChange={(value) =>
              updateItem(index, { image: value || undefined })
            }
          />
        </Field>

        <Field>
          <FieldLabel>Titel</FieldLabel>
          <Input
            value={item.title || ""}
            onChange={(e) => updateItem(index, { title: e.target.value })}
            placeholder={t("admin.placeholders.itemTitle")}
          />
        </Field>
        <Field>
          <FieldLabel>Subtitel</FieldLabel>
          <Input
            value={item.subtitle || ""}
            onChange={(e) => updateItem(index, { subtitle: e.target.value })}
            placeholder={t("admin.placeholders.optionalSubtitle")}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>Open chatbot</FieldLabel>
          <Switch
            checked={item.actionType === "openChatbot"}
            onCheckedChange={(checked) =>
              updateItem(index, {
                actionType: checked ? "openChatbot" : "link",
                href: checked ? undefined : item.href,
              })
            }
          />
        </Field>

        {item.actionType !== "openChatbot" && (
          <Field>
            <FieldLabel>Link URL</FieldLabel>
            <Input
              value={item.href || ""}
              onChange={(e) => updateItem(index, { href: e.target.value })}
              placeholder="/pagina"
            />
            <FieldDescription>
              {currentSite?.domain || "https://..."}
              {item.href || "/..."}
            </FieldDescription>
          </Field>
        )}

        <Separator />

        <div className="space-y-4">
          <FieldLabel>Actie (optioneel)</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel className="text-muted-foreground">Label</FieldLabel>
              <Input
                value={item.action?.label || ""}
                onChange={(e) =>
                  updateItem(index, {
                    action: { ...item.action, label: e.target.value },
                  })
                }
                placeholder={t("admin.placeholders.viewMore")}
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
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderItemForm(items[0], 0)}
      {renderItemForm(items[1], 1)}
    </div>
  );
}
