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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { SlideshowSection } from "@/types/sections";

interface SlideshowImage {
  _key: string;
  image: { url: string; alt?: string };
  caption?: string;
}

interface SlideshowFormProps {
  section: SlideshowSection;
  onChange: (section: SlideshowSection) => void;
}

export function SlideshowForm({ section, onChange }: SlideshowFormProps) {
  const images = section.images || [];

  const addImage = () => {
    const newImage: SlideshowImage = {
      _key: crypto.randomUUID(),
      image: { url: "", alt: "" },
      caption: "",
    };
    onChange({ ...section, images: [...images, newImage] });
  };

  const updateImage = (index: number, updates: Partial<SlideshowImage>) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    onChange({ ...section, images: newImages });
  };

  const removeImage = (index: number) => {
    onChange({ ...section, images: images.filter((_, i) => i !== index) });
  };

  return (
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="background">
          Achtergrond
          <FieldDescription>Toon een gekleurde achtergrond</FieldDescription>
        </FieldLabel>
        <Switch
          id="background"
          checked={section.background || false}
          onCheckedChange={(checked) =>
            onChange({ ...section, background: checked })
          }
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Afbeeldingen</FieldLabel>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            <PlusIcon className="size-4" />
            Afbeelding toevoegen
          </Button>
        </div>

        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen afbeeldingen toegevoegd
          </p>
        ) : (
          <div className="space-y-3">
            {images.map((img, index) => (
              <Card key={img._key}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <ImageUpload
                        value={img.image?.url ? img.image : null}
                        onChange={(value) =>
                          updateImage(index, {
                            image: value || { url: "", alt: "" },
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                  <Field>
                    <FieldLabel>Bijschrift (optioneel)</FieldLabel>
                    <Input
                      value={img.caption || ""}
                      onChange={(e) =>
                        updateImage(index, { caption: e.target.value })
                      }
                      placeholder="Beschrijving van de afbeelding"
                    />
                  </Field>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FieldGroup>
  );
}
