"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { IconSelect } from "@/components/admin/IconSelect";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { UspSectionSection, UspItem } from "@/types/sections";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface UspSectionFormProps {
  section: UspSectionSection;
  onChange: (section: UspSectionSection) => void;
}

const MAX_ITEMS = 5;

export function UspSectionForm({ section, onChange }: UspSectionFormProps) {
  const { currentSite } = useSiteContext();
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
          placeholder={t("admin.placeholders.uspHeading")}
        />
      </Field>

      <div className="space-y-4">
        <header className="flex items-center justify-between">
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
        </header>

        {usps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen USPs toegevoegd
          </p>
        ) : (
          <div className="space-y-6">
            {usps.map((usp, index) => (
              <div key={usp._key} className="p-4 space-y-4 border rounded-lg">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Titel</FieldLabel>
                    <Input
                      value={usp.title || ""}
                      onChange={(e) =>
                        updateUsp(index, { title: e.target.value })
                      }
                      placeholder={t("admin.placeholders.title")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Icoon</FieldLabel>
                    <IconSelect
                      value={usp.icon || ""}
                      onValueChange={(value) =>
                        updateUsp(index, { icon: value })
                      }
                    />
                  </Field>
                </div>

                <RichTextEditor
                  label="Tekst"
                  value={usp.text || ""}
                  onChange={(value) => updateUsp(index, { text: value })}
                  placeholder={t("admin.placeholders.description")}
                />

                <Separator />

                <Field orientation="horizontal">
                  <FieldLabel>Actie</FieldLabel>
                  <Switch
                    checked={!!usp.link}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        updateUsp(index, { link: undefined });
                      } else {
                        updateUsp(index, { link: { label: "", url: "" } });
                      }
                    }}
                  />
                </Field>

                {usp.link && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input
                        value={usp.link?.label || ""}
                        onChange={(e) =>
                          updateUsp(index, {
                            link: { ...usp.link, label: e.target.value },
                          })
                        }
                        placeholder={t("admin.placeholders.moreInfo")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>URL</FieldLabel>
                      <Input
                        value={usp.link?.url || ""}
                        onChange={(e) =>
                          updateUsp(index, {
                            link: { ...usp.link, url: e.target.value },
                          })
                        }
                        placeholder={t("admin.placeholders.contactUrl")}
                      />
                      <FieldDescription>
                        {currentSite?.domain || "https://..."}
                        {usp.link?.url || "/..."}
                      </FieldDescription>
                    </Field>
                  </div>
                )}

                <Separator />

                <Button
                  className="text-destructive"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeUsp(index)}
                >
                  <Trash2Icon className="size-4" />
                  Item verwijderen
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldGroup>
  );
}
