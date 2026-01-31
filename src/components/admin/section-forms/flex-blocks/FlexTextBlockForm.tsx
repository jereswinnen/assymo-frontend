"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface FlexTextBlockFormProps {
  block: FlexTextBlock;
  onChange: (block: FlexTextBlock) => void;
}

export function FlexTextBlockForm({ block, onChange }: FlexTextBlockFormProps) {
  const { currentSite } = useSiteContext();

  return (
    <FieldGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Titel</FieldLabel>
          <Input
            value={block.heading || ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            placeholder={t("admin.placeholders.optionalTitle")}
          />
        </Field>
        <Field>
          <FieldLabel>Titel niveau</FieldLabel>
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
        <FieldLabel>Actie</FieldLabel>
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
          <Field>
            <FieldLabel>{t("admin.labels.action")}</FieldLabel>
            <Select
              value={block.button?.action || "link"}
              onValueChange={(value) =>
                onChange({
                  ...block,
                  button: {
                    ...block.button,
                    action: value as "link" | "openChatbot" | "openConfigurator",
                    url: value !== "link" ? undefined : block.button?.url,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="openChatbot">{t("admin.labels.openChatbot")}</SelectItem>
                <SelectItem value="openConfigurator">{t("admin.labels.openConfigurator")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

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
                placeholder={
                  block.button?.action === "openChatbot"
                    ? "Stel een vraag"
                    : block.button?.action === "openConfigurator"
                      ? "Start configurator"
                      : "Maak een afspraak"
                }
              />
            </Field>
            {block.button?.action === "link" && (
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
                <FieldDescription>
                  {currentSite?.domain || "https://..."}
                  {block.button?.url || "/..."}
                </FieldDescription>
              </Field>
            )}
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
