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
  QuestionOption,
  HeadingLevel,
  PriceCatalogueItem,
} from "@/lib/configurator/types";

interface QuestionEditSheetProps {
  question: ConfiguratorQuestion | null;
  categoryId: string;
  siteId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
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
  { value: "dimensions", label: t("admin.misc.questionTypes.dimensions") },
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
  const [required, setRequired] = useState(true);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [saving, setSaving] = useState(false);

  // Pricing fields for dimensions/number types
  const [pricePerM2Min, setPricePerM2Min] = useState("");
  const [pricePerM2Max, setPricePerM2Max] = useState("");
  const [pricePerUnitMin, setPricePerUnitMin] = useState("");
  const [pricePerUnitMax, setPricePerUnitMax] = useState("");

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
    required: true,
    options: [] as QuestionOption[],
    pricePerM2Min: "",
    pricePerM2Max: "",
    pricePerUnitMin: "",
    pricePerUnitMax: "",
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
      setRequired(question.required);
      setOptions(question.options || []);
      setPricePerM2Min(question.price_per_m2_min ? (question.price_per_m2_min / 100).toString() : "");
      setPricePerM2Max(question.price_per_m2_max ? (question.price_per_m2_max / 100).toString() : "");
      setPricePerUnitMin(question.price_per_unit_min ? (question.price_per_unit_min / 100).toString() : "");
      setPricePerUnitMax(question.price_per_unit_max ? (question.price_per_unit_max / 100).toString() : "");
      setOriginalValues({
        label: question.label,
        headingLevel: question.heading_level || "h2",
        subtitle: question.subtitle || "",
        questionKey: question.question_key,
        type: question.type,
        required: question.required,
        options: question.options || [],
        pricePerM2Min: question.price_per_m2_min ? (question.price_per_m2_min / 100).toString() : "",
        pricePerM2Max: question.price_per_m2_max ? (question.price_per_m2_max / 100).toString() : "",
        pricePerUnitMin: question.price_per_unit_min ? (question.price_per_unit_min / 100).toString() : "",
        pricePerUnitMax: question.price_per_unit_max ? (question.price_per_unit_max / 100).toString() : "",
      });
    } else if (open && !question) {
      setLabel("");
      setHeadingLevel("h2");
      setSubtitle("");
      setQuestionKey("");
      setType("single-select");
      setRequired(true);
      setOptions([]);
      setPricePerM2Min("");
      setPricePerM2Max("");
      setPricePerUnitMin("");
      setPricePerUnitMax("");
      setOriginalValues({
        label: "",
        headingLevel: "h2",
        subtitle: "",
        questionKey: "",
        type: "single-select",
        required: true,
        options: [],
        pricePerM2Min: "",
        pricePerM2Max: "",
        pricePerUnitMin: "",
        pricePerUnitMax: "",
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
      required !== originalValues.required ||
      JSON.stringify(options) !== JSON.stringify(originalValues.options) ||
      pricePerM2Min !== originalValues.pricePerM2Min ||
      pricePerM2Max !== originalValues.pricePerM2Max ||
      pricePerUnitMin !== originalValues.pricePerUnitMin ||
      pricePerUnitMax !== originalValues.pricePerUnitMax
    );
  }, [isNew, label, headingLevel, subtitle, type, required, options, pricePerM2Min, pricePerM2Max, pricePerUnitMin, pricePerUnitMax, originalValues]);

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
      const body = {
        siteId,
        label,
        heading_level: headingLevel,
        subtitle: subtitle || null,
        question_key: questionKey,
        type,
        required,
        options: needsOptions ? options : null,
        category_id: categoryId,
        price_per_m2_min: type === "dimensions" && pricePerM2Min ? Math.round(parseFloat(pricePerM2Min) * 100) : null,
        price_per_m2_max: type === "dimensions" && pricePerM2Max ? Math.round(parseFloat(pricePerM2Max) * 100) : null,
        price_per_unit_min: type === "number" && pricePerUnitMin ? Math.round(parseFloat(pricePerUnitMin) * 100) : null,
        price_per_unit_max: type === "number" && pricePerUnitMax ? Math.round(parseFloat(pricePerUnitMax) * 100) : null,
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

      toast.success(
        question
          ? t("admin.messages.questionUpdated")
          : t("admin.messages.questionCreated")
      );
      onOpenChange(false);
      onSaved();
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

  const updateOptionManualPrice = (index: number, field: "min" | "max", value: string) => {
    const newOptions = [...options];
    const cents = value ? Math.round(parseFloat(value) * 100) : undefined;
    if (field === "min") {
      newOptions[index] = {
        ...newOptions[index],
        priceModifierMin: cents,
        catalogueItemId: undefined, // Clear catalogue when using manual
      };
    } else {
      newOptions[index] = {
        ...newOptions[index],
        priceModifierMax: cents,
        catalogueItemId: undefined, // Clear catalogue when using manual
      };
    }
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
                            <span className="text-muted-foreground shrink-0">Prijs:</span>
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
                                        {item.name} ({formatPrice(item.price_min)} - {formatPrice(item.price_max)})
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Show catalogue item info or manual price inputs */}
                          {hasCatalogue && catalogueItem ? (
                            <div className="text-xs text-muted-foreground pl-1">
                              {formatPrice(catalogueItem.price_min)} - {formatPrice(catalogueItem.price_max)}
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
                                onChange={(e) => updateOptionManualPrice(index, "min", e.target.value)}
                                placeholder="min"
                                className="h-7 w-20 text-xs"
                              />
                              <span className="text-xs">-</span>
                              <span className="text-xs">€</span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={option.priceModifierMax ? option.priceModifierMax / 100 : ""}
                                onChange={(e) => updateOptionManualPrice(index, "max", e.target.value)}
                                placeholder="max"
                                className="h-7 w-20 text-xs"
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

          {/* Price per m² for dimensions type */}
          {type === "dimensions" && (
            <>
              <Separator />
              <FieldSet>
                <FieldLegend variant="label">{t("admin.labels.pricePerM2")}</FieldLegend>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="price-m2-min">{t("admin.labels.priceMin")} (EUR)</FieldLabel>
                    <Input
                      id="price-m2-min"
                      type="number"
                      min="0"
                      step="1"
                      value={pricePerM2Min}
                      onChange={(e) => setPricePerM2Min(e.target.value)}
                      placeholder="100"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="price-m2-max">{t("admin.labels.priceMax")} (EUR)</FieldLabel>
                    <Input
                      id="price-m2-max"
                      type="number"
                      min="0"
                      step="1"
                      value={pricePerM2Max}
                      onChange={(e) => setPricePerM2Max(e.target.value)}
                      placeholder="200"
                    />
                  </Field>
                </div>
              </FieldSet>
            </>
          )}

          {/* Price per unit for number type */}
          {type === "number" && (
            <>
              <Separator />
              <FieldSet>
                <FieldLegend variant="label">{t("admin.labels.pricePerUnit")}</FieldLegend>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="price-unit-min">{t("admin.labels.priceMin")} (EUR)</FieldLabel>
                    <Input
                      id="price-unit-min"
                      type="number"
                      min="0"
                      step="1"
                      value={pricePerUnitMin}
                      onChange={(e) => setPricePerUnitMin(e.target.value)}
                      placeholder="50"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="price-unit-max">{t("admin.labels.priceMax")} (EUR)</FieldLabel>
                    <Input
                      id="price-unit-max"
                      type="number"
                      min="0"
                      step="1"
                      value={pricePerUnitMax}
                      onChange={(e) => setPricePerUnitMax(e.target.value)}
                      placeholder="100"
                    />
                  </Field>
                </div>
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
