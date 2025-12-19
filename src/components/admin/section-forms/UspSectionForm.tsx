"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
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
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { UspSectionSection, UspItem } from "@/types/sections";
import { ICON_OPTIONS } from "@/lib/icons";

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
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="heading">Heading</FieldLabel>
        <Input
          id="heading"
          value={section.heading || ""}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Waarom kiezen voor ons?"
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>USPs</FieldLabel>
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
                      <Field>
                        <FieldLabel>Icoon</FieldLabel>
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
                      </Field>
                      <Field>
                        <FieldLabel>Titel</FieldLabel>
                        <Input
                          value={usp.title || ""}
                          onChange={(e) =>
                            updateUsp(index, { title: e.target.value })
                          }
                          placeholder="USP titel"
                        />
                      </Field>
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

                  <RichTextEditor
                    label="Tekst"
                    value={usp.text || ""}
                    onChange={(value) => updateUsp(index, { text: value })}
                    placeholder="Beschrijving van de USP"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Link label (optioneel)</FieldLabel>
                      <Input
                        value={usp.link?.label || ""}
                        onChange={(e) =>
                          updateUsp(index, {
                            link: { ...usp.link, label: e.target.value },
                          })
                        }
                        placeholder="Meer info"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Link URL (optioneel)</FieldLabel>
                      <Input
                        value={usp.link?.url || ""}
                        onChange={(e) =>
                          updateUsp(index, {
                            link: { ...usp.link, url: e.target.value },
                          })
                        }
                        placeholder="/contact"
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FieldGroup>
  );
}
