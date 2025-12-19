"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusIcon, Trash2Icon, GripVertical } from "lucide-react";
import {
  FlexibleSectionSection,
  FlexibleSectionLayout,
  FlexibleBlock,
  FlexTextBlock,
  FlexImageBlock,
  FlexMapBlock,
  FlexFormBlock,
} from "@/types/sections";
import { FlexTextBlockForm } from "./flex-blocks/FlexTextBlockForm";
import { FlexImageBlockForm } from "./flex-blocks/FlexImageBlockForm";
import { FlexMapBlockForm } from "./flex-blocks/FlexMapBlockForm";
import { FlexFormBlockForm } from "./flex-blocks/FlexFormBlockForm";

const LAYOUT_OPTIONS: { value: FlexibleSectionLayout; label: string }[] = [
  { value: "1-col", label: "1 kolom" },
  { value: "2-col-equal", label: "2 kolommen (gelijk)" },
  { value: "2-col-left-wide", label: "2 kolommen (links breed)" },
  { value: "2-col-right-wide", label: "2 kolommen (rechts breed)" },
];

const VERTICAL_ALIGN_OPTIONS = [
  { value: "top", label: "Boven" },
  { value: "center", label: "Midden" },
  { value: "bottom", label: "Onder" },
];

const BLOCK_TYPES = [
  { type: "flexTextBlock", label: "Tekst blok" },
  { type: "flexImageBlock", label: "Afbeelding blok" },
  { type: "flexMapBlock", label: "Kaart blok" },
  { type: "flexFormBlock", label: "Formulier blok" },
] as const;

interface FlexibleSectionFormProps {
  section: FlexibleSectionSection;
  onChange: (section: FlexibleSectionSection) => void;
}

function createBlock(type: FlexibleBlock["_type"]): FlexibleBlock {
  const _key = crypto.randomUUID();
  switch (type) {
    case "flexTextBlock":
      return { _key, _type: "flexTextBlock", heading: "", text: "" };
    case "flexImageBlock":
      return { _key, _type: "flexImageBlock" };
    case "flexMapBlock":
      return { _key, _type: "flexMapBlock" };
    case "flexFormBlock":
      return { _key, _type: "flexFormBlock", title: "", subtitle: "" };
  }
}

function getBlockLabel(type: FlexibleBlock["_type"]): string {
  return BLOCK_TYPES.find((b) => b.type === type)?.label || type;
}

function BlockForm({
  block,
  onChange,
}: {
  block: FlexibleBlock;
  onChange: (block: FlexibleBlock) => void;
}) {
  switch (block._type) {
    case "flexTextBlock":
      return (
        <FlexTextBlockForm
          block={block}
          onChange={(b) => onChange(b as FlexibleBlock)}
        />
      );
    case "flexImageBlock":
      return (
        <FlexImageBlockForm
          block={block}
          onChange={(b) => onChange(b as FlexibleBlock)}
        />
      );
    case "flexMapBlock":
      return (
        <FlexMapBlockForm
          block={block}
          onChange={(b) => onChange(b as FlexibleBlock)}
        />
      );
    case "flexFormBlock":
      return (
        <FlexFormBlockForm
          block={block}
          onChange={(b) => onChange(b as FlexibleBlock)}
        />
      );
  }
}

interface BlockListProps {
  blocks: FlexibleBlock[];
  onChange: (blocks: FlexibleBlock[]) => void;
  title: string;
}

function BlockList({ blocks, onChange, title }: BlockListProps) {
  const addBlock = (type: FlexibleBlock["_type"]) => {
    onChange([...blocks, createBlock(type)]);
  };

  const updateBlock = (index: number, block: FlexibleBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) {
      return;
    }
    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    onChange(newBlocks);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabel>{title}</FieldLabel>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <PlusIcon className="size-4 mr-1" />
              Blok toevoegen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {BLOCK_TYPES.map(({ type, label }) => (
              <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
          Geen blokken toegevoegd
        </p>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card key={block._key}>
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, "up")}
                    >
                      <GripVertical className="size-3 rotate-90" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, "down")}
                    >
                      <GripVertical className="size-3 rotate-90" />
                    </Button>
                  </div>
                  <CardTitle className="text-sm flex-1">
                    {getBlockLabel(block._type)}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeBlock(index)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-3">
                <BlockForm
                  block={block}
                  onChange={(b) => updateBlock(index, b)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlexibleSectionForm({
  section,
  onChange,
}: FlexibleSectionFormProps) {
  const layout = section.layout || "1-col";
  const isTwoColumn = layout !== "1-col";

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel>Layout</FieldLabel>
          <Select
            value={layout}
            onValueChange={(value) =>
              onChange({ ...section, layout: value as FlexibleSectionLayout })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAYOUT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Verticale uitlijning</FieldLabel>
          <Select
            value={section.verticalAlign || "top"}
            onValueChange={(value) =>
              onChange({
                ...section,
                verticalAlign: value as "top" | "center" | "bottom",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERTICAL_ALIGN_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

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
      </div>

      {isTwoColumn ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <BlockList
            title="Linker kolom"
            blocks={section.blockLeft || []}
            onChange={(blocks) => onChange({ ...section, blockLeft: blocks })}
          />
          <BlockList
            title="Rechter kolom"
            blocks={section.blockRight || []}
            onChange={(blocks) => onChange({ ...section, blockRight: blocks })}
          />
        </div>
      ) : (
        <BlockList
          title="Blokken"
          blocks={section.blockMain || []}
          onChange={(blocks) => onChange({ ...section, blockMain: blocks })}
        />
      )}
    </FieldGroup>
  );
}
