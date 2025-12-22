"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/admin/IconSelect";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { UspSectionSection, UspItem } from "@/types/sections";

interface UspSectionFormProps {
  section: UspSectionSection;
  onChange: (section: UspSectionSection) => void;
}

const MAX_ITEMS = 5;

export function UspSectionForm({ section, onChange }: UspSectionFormProps) {
  const usps = section.usps || [];

  const addUsp = () => {
    if (usps.length >= MAX_ITEMS) return;
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
        <FieldLabel htmlFor="heading">Titel</FieldLabel>
        <Input
          id="heading"
          value={section.heading || ""}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Waarom kiezen voor ons?"
        />
      </Field>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FieldLabel>Items</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addUsp}
            disabled={usps.length >= MAX_ITEMS}
          >
            <PlusIcon className="size-4" />
            Item toevoegen
          </Button>
        </div>

        {usps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen USPs toegevoegd
          </p>
        ) : (
          <div className="space-y-4">
            {usps.map((usp, index) => (
              <Card key={usp._key}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Icoon</FieldLabel>
                        <IconSelect
                          value={usp.icon || ""}
                          onValueChange={(value) =>
                            updateUsp(index, { icon: value })
                          }
                        />
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
