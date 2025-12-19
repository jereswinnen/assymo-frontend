"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { UspSectionSection, UspItem } from "@/types/sections";

const ICON_OPTIONS = [
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

interface UspSectionFormProps {
  section: UspSectionSection;
  onChange: (section: UspSectionSection) => void;
}

export function UspSectionForm({ section, onChange }: UspSectionFormProps) {
  const usps = section.usps || [];

  const addUsp = () => {
    const newUsp: UspItem = {
      _key: crypto.randomUUID(),
      icon: "",
      title: "",
      text: "",
    };
    onChange({ ...section, usps: [...usps, newUsp] });
  };

  const updateUsp = (index: number, updates: Partial<UspItem>) => {
    const newUsps = [...usps];
    newUsps[index] = { ...newUsps[index], ...updates };
    onChange({ ...section, usps: newUsps });
  };

  const removeUsp = (index: number) => {
    onChange({ ...section, usps: usps.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Heading</Label>
        <Input
          id="heading"
          value={section.heading || ""}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Waarom kiezen voor ons?"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>USPs</Label>
          <Button type="button" variant="outline" size="sm" onClick={addUsp}>
            <PlusIcon className="size-4" />
            USP toevoegen
          </Button>
        </div>

        {usps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen USPs toegevoegd
          </p>
        ) : (
          <div className="space-y-3">
            {usps.map((usp, index) => (
              <Card key={usp._key}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Icoon</Label>
                        <Select
                          value={usp.icon || ""}
                          onValueChange={(value) =>
                            updateUsp(index, { icon: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kies icoon" />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Titel</Label>
                        <Input
                          value={usp.title || ""}
                          onChange={(e) =>
                            updateUsp(index, { title: e.target.value })
                          }
                          placeholder="USP titel"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeUsp(index)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Tekst</Label>
                    <Textarea
                      value={usp.text || ""}
                      onChange={(e) =>
                        updateUsp(index, { text: e.target.value })
                      }
                      placeholder="Beschrijving van de USP"
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Link label (optioneel)</Label>
                      <Input
                        value={usp.link?.label || ""}
                        onChange={(e) =>
                          updateUsp(index, {
                            link: { ...usp.link, label: e.target.value },
                          })
                        }
                        placeholder="Meer info"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Link URL (optioneel)</Label>
                      <Input
                        value={usp.link?.url || ""}
                        onChange={(e) =>
                          updateUsp(index, {
                            link: { ...usp.link, url: e.target.value },
                          })
                        }
                        placeholder="/contact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
