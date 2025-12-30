"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSelect } from "@/components/admin/IconSelect";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { PageHeaderSection } from "@/types/sections";
import { Separator } from "@/components/ui/separator";
import { t } from "@/config/strings";

interface ButtonItem {
  _key: string;
  label: string;
  action?: "link" | "openChatbot";
  url?: string;
  icon?: string;
  variant?: "primary" | "secondary";
}

interface PageHeaderFormProps {
  section: PageHeaderSection;
  onChange: (section: PageHeaderSection) => void;
}

export function PageHeaderForm({ section, onChange }: PageHeaderFormProps) {
  const buttons = section.buttons || [];

  const addButton = () => {
    if (buttons.length >= 2) return;
    const newButton: ButtonItem = {
      _key: crypto.randomUUID(),
      label: "",
      url: "",
      variant: "primary",
    };
    onChange({ ...section, buttons: [...buttons, newButton] });
  };

  const updateButton = (index: number, updates: Partial<ButtonItem>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    onChange({ ...section, buttons: newButtons });
  };

  const removeButton = (index: number) => {
    onChange({ ...section, buttons: buttons.filter((_, i) => i !== index) });
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="title">Titel</FieldLabel>
        <Input
          id="title"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder={t("admin.placeholders.pageTitle2")}
        />
      </Field>

      <RichTextEditor
        label="Subtitel"
        value={section.subtitle || ""}
        onChange={(value) => onChange({ ...section, subtitle: value })}
      />

      <Separator />

      <div className="space-y-4">
        <Field orientation="horizontal">
          <FieldLabel htmlFor="background">Toon achtergrond</FieldLabel>
          <Switch
            id="background"
            checked={section.background || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, background: checked })
            }
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="showImage">Toon afbeelding</FieldLabel>
          <Switch
            id="showImage"
            checked={section.showImage || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showImage: checked })
            }
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="showButtons">Toon acties</FieldLabel>
          <Switch
            id="showButtons"
            checked={section.showButtons || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showButtons: checked })
            }
          />
        </Field>
      </div>

      <Separator />

      {section.showButtons && (
        <div className="space-y-4">
          <header className="flex items-center justify-between">
            <FieldLabel>Acties</FieldLabel>
            {buttons.length < 2 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addButton}
              >
                <PlusIcon className="size-4" />
                Knop toevoegen
              </Button>
            )}
          </header>

          {buttons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              Nog geen knoppen toegevoegd
            </p>
          ) : (
            <div className="space-y-6">
              {buttons.map((button, index) => (
                <div
                  key={button._key}
                  className="p-4 space-y-4 border rounded-lg"
                >
                  <Field orientation="horizontal">
                    <FieldLabel>Open chatbot</FieldLabel>
                    <Switch
                      checked={button.action === "openChatbot"}
                      onCheckedChange={(checked) =>
                        updateButton(index, {
                          action: checked ? "openChatbot" : "link",
                          url: checked ? undefined : button.url,
                        })
                      }
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input
                        value={button.label || ""}
                        onChange={(e) =>
                          updateButton(index, { label: e.target.value })
                        }
                        placeholder={
                          button.action === "openChatbot"
                            ? "Stel een vraag"
                            : "Knop tekst"
                        }
                      />
                    </Field>
                    {button.action !== "openChatbot" && (
                      <Field>
                        <FieldLabel>URL</FieldLabel>
                        <Input
                          value={button.url || ""}
                          onChange={(e) =>
                            updateButton(index, { url: e.target.value })
                          }
                          placeholder="/contact"
                        />
                        <FieldDescription>
                          {process.env.NEXT_PUBLIC_BASE_URL || "https://assymo.be"}
                          {button.url || "/..."}
                        </FieldDescription>
                      </Field>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Icoon</FieldLabel>
                      <IconSelect
                        value={button.icon || ""}
                        onValueChange={(value) =>
                          updateButton(index, { icon: value || undefined })
                        }
                        allowNone
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Variant</FieldLabel>
                      <Select
                        value={button.variant || "primary"}
                        onValueChange={(value) =>
                          updateButton(index, {
                            variant: value as "primary" | "secondary",
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

                  <Button
                    className="text-destructive"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeButton(index)}
                  >
                    <Trash2Icon className="size-4" />
                    Knop verwijderen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </FieldGroup>
  );
}
