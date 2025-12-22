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
import {
  ImageIcon,
  MapPinIcon,
  PlusIcon,
  TextIcon,
  Trash2Icon,
  FileTextIcon,
  type LucideIcon,
} from "lucide-react";
import {
  FlexibleSectionSection,
  FlexibleSectionLayout,
  FlexibleBlock,
} from "@/types/sections";
import { FlexTextBlockForm } from "./flex-blocks/FlexTextBlockForm";
import { FlexImageBlockForm } from "./flex-blocks/FlexImageBlockForm";
import { FlexMapBlockForm } from "./flex-blocks/FlexMapBlockForm";
import { FlexFormBlockForm } from "./flex-blocks/FlexFormBlockForm";
import { Separator } from "@/components/ui/separator";

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

const BLOCK_TYPES: {
  type: FlexibleBlock["_type"];
  label: string;
  icon: LucideIcon;
}[] = [
  { type: "flexTextBlock", label: "Tekst", icon: TextIcon },
  { type: "flexImageBlock", label: "Afbeelding", icon: ImageIcon },
  { type: "flexMapBlock", label: "Kaart", icon: MapPinIcon },
  { type: "flexFormBlock", label: "Formulier", icon: FileTextIcon },
];

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

function getBlockInfo(type: FlexibleBlock["_type"]) {
  return BLOCK_TYPES.find((b) => b.type === type);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FieldLabel>{title}</FieldLabel>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <PlusIcon className="size-4" />
              Blok toevoegen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                <Icon className="size-4" />
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
        <div className="space-y-6">
          {blocks.map((block, index) => {
            const blockInfo = getBlockInfo(block._type);
            const Icon = blockInfo?.icon;
            return (
            <div key={block._key} className="p-4 space-y-6 border rounded-lg">
              <header className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {Icon && <Icon className="size-4" />}
                  {blockInfo?.label || block._type}
                </span>
                <Button
                  className="text-destructive"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeBlock(index)}
                >
                  <Trash2Icon className="size-4" />
                  Blok verwijderen
                </Button>
              </header>
              <BlockForm
                block={block}
                onChange={(b) => updateBlock(index, b)}
              />
            </div>
          );
          })}
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Field orientation="horizontal">
        <FieldLabel htmlFor="background">Achtergrond</FieldLabel>
        <Switch
          id="background"
          checked={section.background || false}
          onCheckedChange={(checked) =>
            onChange({ ...section, background: checked })
          }
        />
      </Field>

      <Separator />

      {isTwoColumn ? (
        <div className="space-y-6">
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
