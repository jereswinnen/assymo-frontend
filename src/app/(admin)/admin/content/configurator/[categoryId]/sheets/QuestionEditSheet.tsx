"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import Image from "next/image";
import {
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import type {
  ConfiguratorQuestion,
  QuestionType,
  DisplayType,
  QuestionOption,
  HeadingLevel,
  PriceCatalogueItem,
} from "@/lib/configurator/types";
import type { ConfiguratorStep } from "@/lib/configurator/steps";

interface QuestionEditSheetProps {
  question: ConfiguratorQuestion | null;
  categoryId: string;
  siteId: string | undefined;
  steps?: ConfiguratorStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (question: ConfiguratorQuestion) => void;
}

// Helper to format price in euros
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "single-select", label: t("admin.misc.questionTypes.singleSelect") },
  { value: "multi-select", label: t("admin.misc.questionTypes.multiSelect") },
  { value: "text", label: t("admin.misc.questionTypes.text") },
  { value: "number", label: t("admin.misc.questionTypes.number") },
];

const DISPLAY_TYPES: { value: DisplayType; label: string }[] = [
  { value: "select", label: "Dropdown" },
  { value: "radio-cards", label: "Keuzekaarten" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function QuestionEditSheet({
  question,
  categoryId,
  siteId,
  steps = [],
  open,
  onOpenChange,
  onSaved,
}: QuestionEditSheetProps) {
  const isNew = !question;

  // Form state
  const [label, setLabel] = useState("");
  const [headingLevel, setHeadingLevel] = useState<HeadingLevel>("h2");
  const [subtitle, setSubtitle] = useState("");
  const [questionKey, setQuestionKey] = useState("");
  const [type, setType] = useState<QuestionType>("single-select");
  const [displayType, setDisplayType] = useState<DisplayType>("select");
  const [required, setRequired] = useState(true);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [stepId, setStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Catalogue items for option pricing
  const [catalogueItems, setCatalogueItems] = useState<PriceCatalogueItem[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    label: "",
    headingLevel: "h2" as HeadingLevel,
    subtitle: "",
    questionKey: "",
    type: "single-select" as QuestionType,
    displayType: "select" as DisplayType,
    required: true,
    options: [] as QuestionOption[],
    stepId: null as string | null,
  });

  // Load catalogue items when sheet opens
  useEffect(() => {
    if (open && siteId) {
      loadCatalogueItems();
    }
  }, [open, siteId]);

  const loadCatalogueItems = async () => {
    if (!siteId) return;
    setLoadingCatalogue(true);
    try {
      const response = await fetch(`/api/admin/configurator/catalogue?siteId=${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setCatalogueItems(data);
      }
    } catch (error) {
      console.error("Failed to load catalogue items:", error);
    } finally {
      setLoadingCatalogue(false);
    }
  };

  // Initialize form when sheet opens
  useEffect(() => {
    if (open && question) {
      setLabel(question.label);
      setHeadingLevel(question.heading_level || "h2");
      setSubtitle(question.subtitle || "");
      setQuestionKey(question.question_key);
      setType(question.type);
      setDisplayType(question.display_type || "select");
      setRequired(question.required);
      setOptions(question.options || []);
      setStepId(question.step_id ?? null);
      setOriginalValues({
        label: question.label,
        headingLevel: question.heading_level || "h2",
        subtitle: question.subtitle || "",
        questionKey: question.question_key,
        type: question.type,
        displayType: question.display_type || "select",
        required: question.required,
        options: question.options || [],
        stepId: question.step_id ?? null,
      });
    } else if (open && !question) {
      setLabel("");
      setHeadingLevel("h2");
      setSubtitle("");
      setQuestionKey("");
      setType("single-select");
      setDisplayType("select");
      setRequired(true);
      setOptions([]);
      setStepId(null);
      setOriginalValues({
        label: "",
        headingLevel: "h2",
        subtitle: "",
        questionKey: "",
        type: "single-select",
        displayType: "select",
        required: true,
        options: [],
        stepId: null,
      });
    }
  }, [open, question]);

  // Check if type needs options
  const needsOptions = type === "single-select" || type === "multi-select";

  // Check for changes
  const hasChanges = useMemo(() => {
    if (isNew) {
      return label.trim().length > 0;
    }
    return (
      label !== originalValues.label ||
      headingLevel !== originalValues.headingLevel ||
      subtitle !== originalValues.subtitle ||
      type !== originalValues.type ||
      displayType !== originalValues.displayType ||
      required !== originalValues.required ||
      stepId !== originalValues.stepId ||
      JSON.stringify(options) !== JSON.stringify(originalValues.options)
    );
  }, [isNew, label, headingLevel, subtitle, type, displayType, required, stepId, options, originalValues]);

  // Group catalogue items by category
  const catalogueByCategory = useMemo(() => {
    const groups: Record<string, PriceCatalogueItem[]> = {};
    for (const item of catalogueItems) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [catalogueItems]);

  const handleSave = async () => {
    if (!label.trim() || !questionKey.trim()) {
      toast.error(t("admin.messages.fillAllFields"));
      return;
    }

    if (needsOptions && options.length === 0) {
      toast.error(t("admin.messages.addAtLeastOneOption"));
      return;
    }

    setSaving(true);
    try {
      // Copy catalogue item images to options for denormalization
      const optionsWithImages = needsOptions
        ? options.map((opt) => {
            if (opt.catalogueItemId) {
              const catalogueItem = getCatalogueItem(opt.catalogueItemId);
              return { ...opt, image: catalogueItem?.image || undefined };
            }
            return { ...opt, image: undefined };
          })
        : null;

      const body = {
        siteId,
        label,
        heading_level: headingLevel,
        subtitle: subtitle || null,
        question_key: questionKey,
        type,
        display_type: type === "single-select" ? displayType : "select", // Only relevant for single-select
        required,
        options: optionsWithImages,
        category_id: categoryId,
        step_id: stepId,
      };

      const url = question
        ? `/api/admin/configurator/questions/${question.id}`
        : "/api/admin/configurator/questions";
      const method = question ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save");

      const savedQuestion = await response.json();
      toast.success(
        question
          ? t("admin.messages.questionUpdated")
          : t("admin.messages.questionCreated")
      );
      onOpenChange(false);
      onSaved(savedQuestion);
    } catch (error) {
      console.error("Failed to save question:", error);
      toast.error(t("admin.messages.questionSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { value: "", label: "" }]);
  };

  const updateOptionLabel = (index: number, newLabel: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      label: newLabel,
      value: slugify(newLabel),
    };
    setOptions(newOptions);
  };

  const updateOptionCatalogue = (index: number, catalogueItemId: string | undefined) => {
    const newOptions = [...options];
    if (catalogueItemId) {
      // Set catalogue item, clear manual prices
      newOptions[index] = {
        ...newOptions[index],
        catalogueItemId,
        priceModifierMin: undefined,
        priceModifierMax: undefined,
      };
    } else {
      // Clear catalogue item
      newOptions[index] = {
        ...newOptions[index],
        catalogueItemId: undefined,
      };
    }
    setOptions(newOptions);
  };

  const updateOptionManualPrice = (index: number, value: string) => {
    const newOptions = [...options];
    const cents = value ? Math.round(parseFloat(value) * 100) : undefined;
    newOptions[index] = {
      ...newOptions[index],
      priceModifierMin: cents,
      priceModifierMax: cents, // Same as min - single price
      catalogueItemId: undefined, // Clear catalogue when using manual
    };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // Get catalogue item info for display
  const getCatalogueItem = (id: string | undefined): PriceCatalogueItem | undefined => {
    if (!id) return undefined;
    return catalogueItems.find((item) => item.id === id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="px-4 w-full md:max-w-xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle>
            {question ? t("admin.headings.editQuestion") : t("admin.headings.newQuestion")}
          </SheetTitle>
          <SheetDescription>
            {question
              ? t("admin.misc.editQuestionDesc")
              : t("admin.misc.newQuestionDesc")}
          </SheetDescription>
        </SheetHeader>

        <FieldGroup>
          <FieldSet>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="question-label">{t("admin.labels.title")}</FieldLabel>
                <Input
                  id="question-label"
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (!question) {
                      setQuestionKey(slugify(e.target.value));
                    }
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="question-heading-level">{t("admin.labels.headingLevel")}</FieldLabel>
                <Select value={headingLevel} onValueChange={(v) => setHeadingLevel(v as HeadingLevel)}>
                  <SelectTrigger id="question-heading-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                    <SelectItem value="h4">H4</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <RichTextEditor
              label={t("admin.labels.subtitle")}
              value={subtitle}
              onChange={setSubtitle}
            />

            {steps.length > 0 && (
              <Field>
                <FieldLabel htmlFor="question-step">{t("admin.misc.step")}</FieldLabel>
                <Select
                  value={stepId || "_none"}
                  onValueChange={(v) => setStepId(v === "_none" ? null : v)}
                >
                  <SelectTrigger id="question-step">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{t("admin.misc.noStep")}</SelectItem>
                    {steps.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </FieldSet>

          <Separator />

          <FieldSet>
            <Field>
              <FieldLabel htmlFor="question-type">{t("admin.labels.questionType")}</FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                <SelectTrigger id="question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((qt) => (
                    <SelectItem key={qt.value} value={qt.value}>
                      {qt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {type === "single-select" && (
              <Field>
                <FieldLabel htmlFor="question-display-type">Weergave</FieldLabel>
                <Select value={displayType} onValueChange={(v) => setDisplayType(v as DisplayType)}>
                  <SelectTrigger id="question-display-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPLAY_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field orientation="horizontal">
              <FieldLabel htmlFor="question-required">
                {t("admin.labels.required")}
              </FieldLabel>
              <Checkbox
                id="question-required"
                checked={required}
                onCheckedChange={(checked) => setRequired(checked === true)}
              />
            </Field>
          </FieldSet>

          {needsOptions && (
            <>
              <Separator />
              <FieldSet>
                <FieldLegend variant="label">{t("admin.misc.options")}</FieldLegend>

                {options.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {t("admin.empty.noOptions")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {options.map((option, index) => {
                      const catalogueItem = getCatalogueItem(option.catalogueItemId);
                      const hasCatalogue = !!option.catalogueItemId;
                      const hasManualPrice = option.priceModifierMin !== undefined || option.priceModifierMax !== undefined;

                      return (
                        <div
                          key={index}
                          className="space-y-2 rounded-md border bg-muted/30 p-3"
                        >
                          {/* Show catalogue item image (read-only) for radio-cards display type */}
                          {displayType === "radio-cards" && catalogueItem?.image && (
                            <div className="relative size-12 rounded border bg-muted overflow-hidden">
                              <Image
                                src={catalogueItem.image}
                                alt={catalogueItem.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          )}

                          {/* Option label row */}
                          <div className="flex items-center gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) => updateOptionLabel(index, e.target.value)}
                              placeholder={t("admin.labels.label")}
                              className="h-9 flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>

                          {/* Pricing row */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground shrink-0">{t("admin.labels.startingPrice")}:</span>
                            <Select
                              value={option.catalogueItemId || "_manual"}
                              onValueChange={(value) => {
                                if (value === "_manual") {
                                  updateOptionCatalogue(index, undefined);
                                } else {
                                  updateOptionCatalogue(index, value);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                                <SelectValue placeholder={t("admin.placeholders.selectCatalogueItem")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_manual">
                                  {t("admin.placeholders.noCatalogueItem")}
                                </SelectItem>
                                {Object.entries(catalogueByCategory).map(([category, items]) => (
                                  <div key={category}>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      {category}
                                    </div>
                                    {items.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name} ({formatPrice(item.price_min)})
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Show catalogue item info or manual price input */}
                          {hasCatalogue && catalogueItem ? (
                            <div className="text-xs text-muted-foreground pl-1">
                              {formatPrice(catalogueItem.price_min)}
                              {catalogueItem.unit && <span className="ml-1">({catalogueItem.unit})</span>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">of</span>
                              <span className="text-xs">€</span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={option.priceModifierMin ? option.priceModifierMin / 100 : ""}
                                onChange={(e) => updateOptionManualPrice(index, e.target.value)}
                                placeholder="0"
                                className="h-7 w-24 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <PlusIcon className="size-4" />
                  {t("admin.buttons.addItem")}
                </Button>
              </FieldSet>
            </>
          )}
        </FieldGroup>

        <SheetFooter className="px-0">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("admin.loading.saving")}
              </>
            ) : (
              <>
                <CheckIcon className="size-4" />
                {question ? t("admin.buttons.save") : t("admin.buttons.create")}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
