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

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    label: "",
    headingLevel: "h2" as HeadingLevel,
    subtitle: "",
    questionKey: "",
    type: "single-select" as QuestionType,
    required: true,
    options: [] as QuestionOption[],
  });

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
      setOriginalValues({
        label: question.label,
        headingLevel: question.heading_level || "h2",
        subtitle: question.subtitle || "",
        questionKey: question.question_key,
        type: question.type,
        required: question.required,
        options: question.options || [],
      });
    } else if (open && !question) {
      setLabel("");
      setHeadingLevel("h2");
      setSubtitle("");
      setQuestionKey("");
      setType("single-select");
      setRequired(true);
      setOptions([]);
      setOriginalValues({
        label: "",
        headingLevel: "h2",
        subtitle: "",
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
      return label.trim().length > 0;
    }
    return (
      label !== originalValues.label ||
      headingLevel !== originalValues.headingLevel ||
      subtitle !== originalValues.subtitle ||
      type !== originalValues.type ||
      required !== originalValues.required ||
      JSON.stringify(options) !== JSON.stringify(originalValues.options)
    );
  }, [isNew, label, headingLevel, subtitle, type, required, options, originalValues]);

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
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={option.label}
                          onChange={(e) => updateOptionLabel(index, e.target.value)}
                          placeholder={t("admin.labels.label")}
                          className="h-9 flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-9 text-muted-foreground hover:text-destructive"
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
