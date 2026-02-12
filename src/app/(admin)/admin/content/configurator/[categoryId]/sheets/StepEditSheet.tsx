"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { t } from "@/config/strings";
import type { ConfiguratorStep } from "@/lib/configurator/steps";

interface StepEditSheetProps {
  step: ConfiguratorStep | null;
  categoryId: string;
  siteId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (step: ConfiguratorStep) => void;
}

export function StepEditSheet({
  step,
  categoryId,
  siteId,
  open,
  onOpenChange,
  onSaved,
}: StepEditSheetProps) {
  const isNew = !step;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [originalValues, setOriginalValues] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (open && step) {
      setName(step.name);
      setDescription(step.description || "");
      setOriginalValues({
        name: step.name,
        description: step.description || "",
      });
    } else if (open && !step) {
      setName("");
      setDescription("");
      setOriginalValues({ name: "", description: "" });
    }
  }, [open, step]);

  const hasChanges = useMemo(() => {
    if (isNew) return name.trim().length > 0;
    return (
      name !== originalValues.name || description !== originalValues.description
    );
  }, [isNew, name, description, originalValues]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("admin.messages.fillAllFields"));
      return;
    }

    setSaving(true);
    try {
      const body = {
        siteId,
        categoryId,
        name,
        description: description || null,
      };

      const url = step
        ? `/api/admin/configurator/steps/${step.id}`
        : "/api/admin/configurator/steps";
      const method = step ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save");

      const savedStep = await response.json();
      toast.success(
        step
          ? t("admin.messages.stepUpdated")
          : t("admin.messages.stepCreated")
      );
      onOpenChange(false);
      onSaved(savedStep);
    } catch (error) {
      console.error("Failed to save step:", error);
      toast.error(t("admin.messages.stepSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="px-4 w-full md:max-w-md overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle>
            {step ? t("admin.headings.editStep") : t("admin.headings.newStep")}
          </SheetTitle>
          <SheetDescription>
            {step
              ? t("admin.misc.editStepDesc")
              : t("admin.misc.newStepDesc")}
          </SheetDescription>
        </SheetHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="step-name">
              {t("admin.labels.name")}
            </FieldLabel>
            <Input
              id="step-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Afmetingen"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="step-description">
              {t("admin.labels.description")}
            </FieldLabel>
            <Textarea
              id="step-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.placeholders.description")}
              rows={3}
            />
          </Field>
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
                {step ? t("admin.buttons.save") : t("admin.buttons.create")}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
