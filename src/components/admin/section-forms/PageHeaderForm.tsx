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
import { PlusIcon, Trash2Icon } from "lucide-react";
import { PageHeaderSection } from "@/types/sections";
import { ICON_OPTIONS_WITH_NONE } from "@/lib/icons";

interface ButtonItem {
  _key: string;
  label: string;
  url: string;
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
          placeholder="Page titel"
        />
      </Field>

      <RichTextEditor
        label="Subtitel"
        value={section.subtitle || ""}
        onChange={(value) => onChange({ ...section, subtitle: value })}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field orientation="horizontal" className="sm:flex-col sm:items-start">
          <FieldLabel htmlFor="background">
            Achtergrond
            <FieldDescription>Grijze achtergrond</FieldDescription>
          </FieldLabel>
          <Switch
            id="background"
            checked={section.background || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, background: checked })
            }
          />
        </Field>

        <Field orientation="horizontal" className="sm:flex-col sm:items-start">
          <FieldLabel htmlFor="showImage">
            Toon afbeelding
            <FieldDescription>Header afbeelding</FieldDescription>
          </FieldLabel>
          <Switch
            id="showImage"
            checked={section.showImage || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showImage: checked })
            }
          />
        </Field>

        <Field orientation="horizontal" className="sm:flex-col sm:items-start">
          <FieldLabel htmlFor="showButtons">
            Toon knoppen
            <FieldDescription>CTA knoppen</FieldDescription>
          </FieldLabel>
          <Switch
            id="showButtons"
            checked={section.showButtons || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showButtons: checked })
            }
          />
        </Field>
      </div>

      {section.showButtons && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel>Knoppen (max. 2)</FieldLabel>
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
          </div>

          {buttons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              Nog geen knoppen toegevoegd
            </p>
          ) : (
            <div className="space-y-3">
              {buttons.map((button, index) => (
                <Card key={button._key}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 grid gap-3 sm:grid-cols-2">
                        <Field>
                          <FieldLabel>Label</FieldLabel>
                          <Input
                            value={button.label || ""}
                            onChange={(e) =>
                              updateButton(index, { label: e.target.value })
                            }
                            placeholder="Knop tekst"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>URL</FieldLabel>
                          <Input
                            value={button.url || ""}
                            onChange={(e) =>
                              updateButton(index, { url: e.target.value })
                            }
                            placeholder="/contact"
                          />
                        </Field>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeButton(index)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Icoon</FieldLabel>
                        <Select
                          value={button.icon || ""}
                          onValueChange={(value) =>
                            updateButton(index, { icon: value || undefined })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kies icoon" />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS_WITH_NONE.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value || "none"}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </FieldGroup>
  );
}
