"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  FormIcon,
  ImageIcon,
  MapIcon,
  PlusIcon,
  TextInitialIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import {
  FlexibleSectionSection,
  FlexibleSectionLayout,
  FlexibleBlock,
} from "@/types/sections";
import { t } from "@/config/strings";
import { FlexTextBlockForm } from "./flex-blocks/FlexTextBlockForm";
import { FlexImageBlockForm } from "./flex-blocks/FlexImageBlockForm";
import { FlexMapBlockForm } from "./flex-blocks/FlexMapBlockForm";
import { FlexFormBlockForm } from "./flex-blocks/FlexFormBlockForm";
import { Separator } from "@/components/ui/separator";

const LAYOUT_OPTIONS: { value: FlexibleSectionLayout; labelKey: string }[] = [
  { value: "1-col", labelKey: "admin.misc.col1" },
  { value: "2-col-equal", labelKey: "admin.misc.col2Equal" },
  { value: "2-col-left-wide", labelKey: "admin.misc.col2LeftWide" },
  { value: "2-col-right-wide", labelKey: "admin.misc.col2RightWide" },
];

const VERTICAL_ALIGN_OPTIONS = [
  { value: "top", labelKey: "admin.misc.top" },
  { value: "center", labelKey: "admin.misc.center" },
  { value: "bottom", labelKey: "admin.misc.bottom" },
];

const BLOCK_TYPES: {
  type: FlexibleBlock["_type"];
  labelKey: string;
  icon: LucideIcon;
}[] = [
  { type: "flexTextBlock", labelKey: "admin.misc.text", icon: TextInitialIcon },
  { type: "flexImageBlock", labelKey: "admin.misc.image", icon: ImageIcon },
  { type: "flexMapBlock", labelKey: "admin.misc.map", icon: MapIcon },
  { type: "flexFormBlock", labelKey: "admin.misc.form", icon: FormIcon },
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
              {t("admin.buttons.addBlock")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {BLOCK_TYPES.map(({ type, labelKey, icon: Icon }) => (
              <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                <Icon className="size-4" />
                {t(labelKey as Parameters<typeof t>[0])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
          {t("admin.empty.noBlocks")}
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
                    {blockInfo
                      ? t(blockInfo.labelKey as Parameters<typeof t>[0])
                      : block._type}
                  </span>
                  <Button
                    className="text-destructive"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeBlock(index)}
                  >
                    <Trash2Icon className="size-4" />
                    {t("admin.buttons.removeBlock")}
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
          <FieldLabel>{t("admin.labels.layout")}</FieldLabel>
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
                  {t(opt.labelKey as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>{t("admin.labels.verticalAlign")}</FieldLabel>
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
                  {t(opt.labelKey as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field orientation="horizontal">
        <FieldLabel htmlFor="background">{t("admin.labels.background")}</FieldLabel>
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
            title={t("admin.labels.leftColumn")}
            blocks={section.blockLeft || []}
            onChange={(blocks) => onChange({ ...section, blockLeft: blocks })}
          />
          <BlockList
            title={t("admin.labels.rightColumn")}
            blocks={section.blockRight || []}
            onChange={(blocks) => onChange({ ...section, blockRight: blocks })}
          />
        </div>
      ) : (
        <BlockList
          title={t("admin.labels.blocks")}
          blocks={section.blockMain || []}
          onChange={(blocks) => onChange({ ...section, blockMain: blocks })}
        />
      )}
    </FieldGroup>
  );
}
