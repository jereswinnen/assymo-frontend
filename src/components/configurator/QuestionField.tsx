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
  FieldDescription,
} from "@/components/ui/field";
import type { QuestionOption, QuestionType } from "@/lib/configurator/types";

export interface QuestionConfig {
  question_key: string;
  label: string;
  type: QuestionType;
  options?: QuestionOption[] | null;
  required: boolean;
  description?: string;
}

type AnswerValue =
  | string
  | string[]
  | number
  | { length: number; width: number; height?: number }
  | undefined;

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

    case "dimensions":
      return (
        <DimensionsField
          question={question}
          value={value as { length: number; width: number; height?: number } | undefined}
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
        <FieldDescription>{question.description}</FieldDescription>
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
        <FieldDescription>{question.description}</FieldDescription>
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
        <FieldDescription>{question.description}</FieldDescription>
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
        <FieldDescription>{question.description}</FieldDescription>
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

// =============================================================================
// Dimensions Field (Length x Width, optional Height)
// =============================================================================

interface DimensionsFieldProps {
  question: QuestionConfig;
  value: { length: number; width: number; height?: number } | undefined;
  onChange: (value: { length: number; width: number; height?: number } | undefined) => void;
  disabled?: boolean;
  className?: string;
}

function DimensionsField({
  question,
  value,
  onChange,
  disabled,
  className,
}: DimensionsFieldProps) {
  const currentValue = value || { length: 0, width: 0 };

  const handleFieldChange = (
    field: "length" | "width" | "height",
    newVal: number | undefined
  ) => {
    const updated = { ...currentValue };
    if (field === "height") {
      if (newVal === undefined || newVal === 0) {
        delete updated.height;
      } else {
        updated.height = newVal;
      }
    } else {
      updated[field] = newVal ?? 0;
    }
    onChange(updated.length === 0 && updated.width === 0 ? undefined : updated);
  };

  return (
    <Field className={className}>
      <FieldLabel>
        {question.label}
        {question.required && " *"}
      </FieldLabel>
      {question.description && (
        <FieldDescription>{question.description}</FieldDescription>
      )}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${question.question_key}-length`} className="text-sm text-stone-600">
            Lengte (m)
          </label>
          <Input
            id={`${question.question_key}-length`}
            type="number"
            min={0}
            step={0.1}
            value={currentValue.length || ""}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange("length", val === "" ? undefined : Number(val));
            }}
            disabled={disabled}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${question.question_key}-width`} className="text-sm text-stone-600">
            Breedte (m)
          </label>
          <Input
            id={`${question.question_key}-width`}
            type="number"
            min={0}
            step={0.1}
            value={currentValue.width || ""}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange("width", val === "" ? undefined : Number(val));
            }}
            disabled={disabled}
            placeholder="0"
          />
        </div>
      </div>
    </Field>
  );
}
