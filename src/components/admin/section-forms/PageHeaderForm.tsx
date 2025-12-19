"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { PageHeaderSection } from "@/types/sections";

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

  // Get subtitle as plain text for now (rich text comes in Phase 15)
  const getSubtitleText = () => {
    if (!section.subtitle || !Array.isArray(section.subtitle)) return "";
    // Extract text from portable text blocks
    return (section.subtitle as { children?: { text?: string }[] }[])
      .map((block) =>
        block.children?.map((child) => child.text || "").join("") || ""
      )
      .join("\n");
  };

  const setSubtitleText = (text: string) => {
    // Convert plain text to simple portable text format
    const blocks = text.split("\n").map((line) => ({
      _type: "block",
      _key: crypto.randomUUID(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: crypto.randomUUID(), text: line, marks: [] }],
    }));
    onChange({ ...section, subtitle: blocks });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Page titel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitel</Label>
        <Textarea
          id="subtitle"
          value={getSubtitleText()}
          onChange={(e) => setSubtitleText(e.target.value)}
          placeholder="Optionele subtitel tekst"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Rich text editor komt in een volgende fase
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-2">
          <div>
            <Label htmlFor="background">Achtergrond</Label>
            <p className="text-xs text-muted-foreground">Grijze achtergrond</p>
          </div>
          <Switch
            id="background"
            checked={section.background || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, background: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-2">
          <div>
            <Label htmlFor="showImage">Toon afbeelding</Label>
            <p className="text-xs text-muted-foreground">Header afbeelding</p>
          </div>
          <Switch
            id="showImage"
            checked={section.showImage || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showImage: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-2">
          <div>
            <Label htmlFor="showButtons">Toon knoppen</Label>
            <p className="text-xs text-muted-foreground">CTA knoppen</p>
          </div>
          <Switch
            id="showButtons"
            checked={section.showButtons || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showButtons: checked })
            }
          />
        </div>
      </div>

      {section.showButtons && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Knoppen (max. 2)</Label>
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
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={button.label || ""}
                            onChange={(e) =>
                              updateButton(index, { label: e.target.value })
                            }
                            placeholder="Knop tekst"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">URL</Label>
                          <Input
                            value={button.url || ""}
                            onChange={(e) =>
                              updateButton(index, { url: e.target.value })
                            }
                            placeholder="/contact"
                          />
                        </div>
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
                      <div className="space-y-1">
                        <Label className="text-xs">Icoon</Label>
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
                            {ICON_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value || "none"}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Variant</Label>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
