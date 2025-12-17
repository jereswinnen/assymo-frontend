"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FieldError,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { CheckIcon, MailCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getVisibleFields,
  getInitialFormData,
  isValidEmail,
  type FieldConfig,
  type Subject,
  type FormDataState,
} from "@/config/contactForm";

function RequiredLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <>
      {children}
      {required && <span className="text-red-500">*</span>}
    </>
  );
}

type FormStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormProps {
  className?: string;
}

export default function ContactForm({ className }: ContactFormProps) {
  const [formData, setFormData] = useState<FormDataState>(getInitialFormData);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const currentSubject = formData.subject as Subject;

  const visibleFields = getVisibleFields(currentSubject);

  const isFormValid = visibleFields
    .filter((field) => field.required)
    .every((field) => {
      const value = formData[field.name];
      if (field.name === "email") return isValidEmail(String(value || ""));
      if (typeof value === "string") return value.trim() !== "";
      return Boolean(value);
    });

  function updateField(name: string, value: string | boolean | File | null) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || isSuccess || !isFormValid) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const data = new FormData();

      visibleFields.forEach((field) => {
        const value = formData[field.name];
        if (field.type === "file" && value instanceof File) {
          data.set(
            field.name === "grondplanFile" ? "grondplan" : field.name,
            value,
          );
        } else if (field.type === "checkbox") {
          data.set(field.name, String(value));
        } else if (typeof value === "string") {
          data.set(field.name, value);
        }
      });

      const res = await fetch("/api/contact", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(
          json.error || "Er is iets misgegaan. Probeer later opnieuw.",
        );
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Er is iets misgegaan. Probeer later opnieuw.",
      );
    }
  }

  function renderField(field: FieldConfig) {
    const isDisabled = isSubmitting || isSuccess;
    const value = formData[field.name];

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <Field key={field.name}>
            <FieldLabel htmlFor={field.name}>
              <RequiredLabel required={field.required}>
                {field.label}
              </RequiredLabel>
            </FieldLabel>
            <Input
              id={field.name}
              type={field.type}
              required={field.required}
              value={String(value || "")}
              onChange={(e) => updateField(field.name, e.target.value)}
              autoComplete={field.autoComplete}
              disabled={isDisabled}
            />
          </Field>
        );

      case "textarea":
        return (
          <Field key={field.name}>
            <FieldLabel htmlFor={field.name}>
              <RequiredLabel required={field.required}>
                {field.label}
              </RequiredLabel>
            </FieldLabel>
            <Textarea
              id={field.name}
              required={field.required}
              value={String(value || "")}
              onChange={(e) => updateField(field.name, e.target.value)}
              className="min-h-40"
              disabled={isDisabled}
            />
          </Field>
        );

      case "select":
        return (
          <Field key={field.name}>
            <FieldLabel htmlFor={field.name}>
              <RequiredLabel required={field.required}>
                {field.label}
              </RequiredLabel>
            </FieldLabel>
            <Select
              value={String(value || "")}
              onValueChange={(v) => updateField(field.name, v)}
              disabled={isDisabled}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        );

      case "file":
        return (
          <Field key={field.name}>
            <FieldLabel htmlFor={field.name}>
              <RequiredLabel required={field.required}>
                {field.label}
              </RequiredLabel>
            </FieldLabel>
            <Input
              id={field.name}
              type="file"
              accept={field.accept}
              onChange={(e) =>
                updateField(field.name, e.target.files?.[0] || null)
              }
              disabled={isDisabled}
            />
          </Field>
        );

      case "checkbox":
        return (
          <Field key={field.name} orientation="horizontal">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) =>
                updateField(field.name, checked === true)
              }
              disabled={isDisabled}
            />
            <FieldLabel htmlFor={field.name} className="font-normal">
              {field.label}
            </FieldLabel>
          </Field>
        );

      default:
        return null;
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <FieldGroup>
        {visibleFields.map(renderField)}

        {status === "error" && <FieldError>{errorMessage}</FieldError>}

        <Button
          type="submit"
          disabled={isSubmitting || (!isSuccess && !isFormValid)}
          className={cn(
            "w-fit px-3.5 py-2 flex items-center gap-1.5 text-accent-light bg-accent-dark transition-colors duration-250 hover:text-accent-dark hover:bg-accent-light rounded-full",
            isSubmitting &&
              "text-stone-600 bg-stone-200 hover:text-stone-600 hover:bg-stone-200",
            isSuccess &&
              "text-stone-600 bg-stone-200 hover:text-stone-600 hover:bg-stone-200",
          )}
        >
          {isSubmitting && (
            <>
              <Spinner className="size-4" />
              <span>Laden...</span>
            </>
          )}
          {isSuccess && (
            <>
              <CheckIcon className="size-4" />
              <span>Gelukt!</span>
            </>
          )}
          {!isSubmitting && !isSuccess && (
            <>
              <MailCheckIcon className="size-4" />
              <span>Versturen</span>
            </>
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
