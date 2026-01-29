"use client";

import { cn } from "@/lib/utils";
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
  FieldLabel,
} from "@/components/ui/field";
import { RichText } from "@/components/RichText";
import { RadioCardGroup } from "./RadioCardGroup";
import type { QuestionOption, QuestionType, DisplayType } from "@/lib/configurator/types";

export interface QuestionConfig {
  question_key: string;
  label: string;
  type: QuestionType;
  display_type?: DisplayType;
  options?: QuestionOption[] | null;
  required: boolean;
  description?: string;
}

type AnswerValue = string | string[] | number | undefined;

interface QuestionFieldProps {
  question: QuestionConfig;
  value: AnswerValue;
  onChange: (key: string, value: AnswerValue) => void;
  disabled?: boolean;
  className?: string;
}

export function QuestionField({
  question,
  value,
  onChange,
  disabled = false,
  className,
}: QuestionFieldProps) {
  const handleChange = (newValue: AnswerValue) => {
    onChange(question.question_key, newValue);
  };

  switch (question.type) {
    case "single-select":
      // Use radio cards if display_type is set to "radio-cards"
      if (question.display_type === "radio-cards") {
        return (
          <RadioCardsField
            question={question}
            value={value as string | undefined}
            onChange={handleChange}
            disabled={disabled}
            className={className}
          />
        );
      }
      return (
        <SingleSelectField
          question={question}
          value={value as string | undefined}
          onChange={handleChange}
          disabled={disabled}
          className={className}
        />
      );

    case "multi-select":
      return (
        <MultiSelectField
          question={question}
          value={(value as string[] | undefined) || []}
          onChange={handleChange}
          disabled={disabled}
          className={className}
        />
      );

    case "text":
      return (
        <TextField
          question={question}
          value={value as string | undefined}
          onChange={handleChange}
          disabled={disabled}
          className={className}
        />
      );

    case "number":
      return (
        <NumberField
          question={question}
          value={value as number | undefined}
          onChange={handleChange}
          disabled={disabled}
          className={className}
        />
      );

    default:
      return null;
  }
}

// =============================================================================
// Single Select Field
// =============================================================================

interface SingleSelectFieldProps {
  question: QuestionConfig;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

function SingleSelectField({
  question,
  value,
  onChange,
  disabled,
  className,
}: SingleSelectFieldProps) {
  const options = question.options || [];

  return (
    <Field className={className}>
      <FieldLabel htmlFor={question.question_key}>
        {question.label}
        {question.required && " *"}
      </FieldLabel>
      {question.description && (
        <RichText html={question.description} className="text-sm text-muted-foreground [&_p]:m-0" />
      )}
      <Select
        value={value || ""}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={question.question_key} className="w-full">
          <SelectValue placeholder="Selecteer..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

// =============================================================================
// Radio Cards Field (Visual card selection)
// =============================================================================

interface RadioCardsFieldProps {
  question: QuestionConfig;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

function RadioCardsField({
  question,
  value,
  onChange,
  disabled,
  className,
}: RadioCardsFieldProps) {
  const options = question.options || [];

  return (
    <Field className={className}>
      <FieldLabel>
        {question.label}
        {question.required && " *"}
      </FieldLabel>
      {question.description && (
        <RichText html={question.description} className="text-sm text-muted-foreground [&_p]:m-0" />
      )}
      <RadioCardGroup
        options={options.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </Field>
  );
}

// =============================================================================
// Multi Select Field (Checkbox Group)
// =============================================================================

interface MultiSelectFieldProps {
  question: QuestionConfig;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

function MultiSelectField({
  question,
  value,
  onChange,
  disabled,
  className,
}: MultiSelectFieldProps) {
  const options = question.options || [];

  const handleToggle = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <Field className={className}>
      <FieldLabel>
        {question.label}
        {question.required && " *"}
      </FieldLabel>
      {question.description && (
        <RichText html={question.description} className="text-sm text-muted-foreground [&_p]:m-0" />
      )}
      <div className="flex flex-col gap-3 mt-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Checkbox
              checked={value.includes(option.value)}
              onCheckedChange={(checked) =>
                handleToggle(option.value, checked === true)
              }
              disabled={disabled}
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </Field>
  );
}

// =============================================================================
// Text Field
// =============================================================================

interface TextFieldProps {
  question: QuestionConfig;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

function TextField({
  question,
  value,
  onChange,
  disabled,
  className,
}: TextFieldProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={question.question_key}>
        {question.label}
        {question.required && " *"}
      </FieldLabel>
      {question.description && (
        <RichText html={question.description} className="text-sm text-muted-foreground [&_p]:m-0" />
      )}
      <Input
        id={question.question_key}
        type="text"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : val);
        }}
        disabled={disabled}
      />
    </Field>
  );
}

// =============================================================================
// Number Field
// =============================================================================

interface NumberFieldProps {
  question: QuestionConfig;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
}

function NumberField({
  question,
  value,
  onChange,
  disabled,
  className,
}: NumberFieldProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={question.question_key}>
        {question.label}
        {question.required && " *"}
      </FieldLabel>
      {question.description && (
        <RichText html={question.description} className="text-sm text-muted-foreground [&_p]:m-0" />
      )}
      <Input
        id={question.question_key}
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : Number(val));
        }}
        disabled={disabled}
        placeholder="0"
      />
    </Field>
  );
}

