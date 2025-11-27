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
import { CheckIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getVisibleFields,
  getInitialFormData,
  isValidEmail,
  type FieldConfig,
  type Subject,
  type FormDataState,
} from "@/config/contactForm";

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type FormStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormProps {
  section: {
    _type: "contactForm";
    heading?: string;
  };
}

export default function ContactForm({ section }: ContactFormProps) {
  const [formData, setFormData] = useState<FormDataState>(getInitialFormData);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const currentSubject = formData.subject as Subject;

  // Get visible fields for current subject
  const visibleFields = getVisibleFields(currentSubject);

  // Check if all required visible fields are filled
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

      // Add all visible fields to form data
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

  // Render a single field based on its config
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
    <section className="col-span-full grid grid-cols-subgrid gap-y-6">
      {section.heading && (
        <header className="hidden col-span-full">
          <h2>{section.heading}</h2>
        </header>
      )}

      <div className="col-span-full max-w-3xl mx-auto w-full">
        {section.heading && <h2 className="mb-6">{section.heading}</h2>}

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {visibleFields.map(renderField)}

            {status === "error" && <FieldError>{errorMessage}</FieldError>}

            <Button
              type="submit"
              disabled={isSubmitting || (!isSuccess && !isFormValid)}
              className={cn(
                "w-fit",
                isSuccess && "bg-green-600 hover:bg-green-600 text-white",
              )}
            >
              {isSubmitting && (
                <>
                  <Spinner className="size-4" />
                  <span>Laden</span>
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
                  <SendIcon className="size-4" />
                  <span>Versturen</span>
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </section>
  );
}
