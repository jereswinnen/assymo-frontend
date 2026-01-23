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
} from "@/lib/configurator/types";

interface QuestionEditSheetProps {
  question: ConfiguratorQuestion | null;
  categoryId: string;
  siteId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "single-select", label: t("admin.misc.questionTypes.singleSelect") },
  { value: "multi-select", label: t("admin.misc.questionTypes.multiSelect") },
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
  const [questionKey, setQuestionKey] = useState("");
  const [type, setType] = useState<QuestionType>("single-select");
  const [required, setRequired] = useState(true);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [saving, setSaving] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    label: "",
    questionKey: "",
    type: "single-select" as QuestionType,
    required: true,
    options: [] as QuestionOption[],
  });

  // Initialize form when sheet opens
  useEffect(() => {
    if (open && question) {
      setLabel(question.label);
      setQuestionKey(question.question_key);
      setType(question.type);
      setRequired(question.required);
      setOptions(question.options || []);
      setOriginalValues({
        label: question.label,
        questionKey: question.question_key,
        type: question.type,
        required: question.required,
        options: question.options || [],
      });
    } else if (open && !question) {
      setLabel("");
      setQuestionKey("");
      setType("single-select");
      setRequired(true);
      setOptions([]);
      setOriginalValues({
        label: "",
        questionKey: "",
        type: "single-select",
        required: true,
        options: [],
      });
    }
  }, [open, question]);

  // Check if type needs options
  const needsOptions = type === "single-select" || type === "multi-select";

  // Check for changes
  const hasChanges = useMemo(() => {
    if (isNew) {
      // For new questions, only need label (key is auto-generated)
      return label.trim().length > 0;
    }
    return (
      label !== originalValues.label ||
      type !== originalValues.type ||
      required !== originalValues.required ||
      JSON.stringify(options) !== JSON.stringify(originalValues.options)
    );
  }, [isNew, label, type, required, options, originalValues]);

  const handleSave = async () => {
    if (!label.trim() || !questionKey.trim()) {
      toast.error(t("admin.messages.fillAllFields"));
      return;
    }

    if (needsOptions && options.length === 0) {
      toast.error("Voeg minstens één optie toe");
      return;
    }

    setSaving(true);
    try {
      const body = {
        siteId,
        label,
        question_key: questionKey,
        type,
        required,
        options: needsOptions ? options : null,
        category_id: categoryId,
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

  const updateOption = (index: number, field: keyof QuestionOption, value: string | number) => {
    const newOptions = [...options];
    if (field === "priceModifier") {
      // Convert euro input to cents
      const euros = parseFloat(value as string) || 0;
      newOptions[index] = { ...newOptions[index], priceModifier: Math.round(euros * 100) };
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value };
    }
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
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
            <Field>
              <FieldLabel htmlFor="question-label">{t("admin.labels.label")}</FieldLabel>
              <Input
                id="question-label"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  // Auto-generate question key from label for new questions
                  if (!question) {
                    setQuestionKey(slugify(e.target.value));
                  }
                }}
                placeholder={t("admin.placeholders.questionLabel")}
              />
            </Field>

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
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div
                        key={index}
                        className="group flex gap-2 p-3 bg-muted/50 rounded-md"
                      >
                        <div className="flex-1 space-y-2">
                          <Input
                            value={option.label}
                            onChange={(e) => {
                              updateOption(index, "label", e.target.value);
                              // Auto-generate value from label if empty
                              if (!option.value) {
                                updateOption(index, "value", slugify(e.target.value));
                              }
                            }}
                            placeholder={t("admin.placeholders.optionLabel")}
                            className="h-8"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={option.value}
                              onChange={(e) => updateOption(index, "value", e.target.value)}
                              placeholder={t("admin.placeholders.optionValue")}
                              className="h-8 flex-1"
                            />
                            <Input
                              type="number"
                              value={option.priceModifier ? option.priceModifier / 100 : ""}
                              onChange={(e) => updateOption(index, "priceModifier", e.target.value)}
                              placeholder={t("admin.placeholders.priceModifier")}
                              className="h-8 w-24"
                            />
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    ))}
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
