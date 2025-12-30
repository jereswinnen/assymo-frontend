"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  CheckIcon,
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { t } from "@/config/strings";

interface DateOverrideCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function DateOverrideCreateSheet({
  open,
  onOpenChange,
  onCreated,
}: DateOverrideCreateSheetProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    end_date: "",
    is_closed: true,
    open_time: "10:00",
    close_time: "17:00",
    reason: "",
    is_recurring: false,
    show_on_website: false,
    hasDateRange: false,
  });

  const resetForm = () => {
    setFormData({
      date: "",
      end_date: "",
      is_closed: true,
      open_time: "10:00",
      close_time: "17:00",
      reason: "",
      is_recurring: false,
      show_on_website: false,
      hasDateRange: false,
    });
  };

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleCreate = async () => {
    if (!formData.date) {
      toast.error(t("admin.messages.selectDate"));
      return;
    }

    if (formData.hasDateRange && !formData.end_date) {
      toast.error(t("admin.messages.selectEndDate"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/appointments/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          end_date: formData.hasDateRange ? formData.end_date : null,
          is_closed: formData.is_closed,
          open_time: formData.is_closed ? null : formData.open_time,
          close_time: formData.is_closed ? null : formData.close_time,
          reason: formData.reason || undefined,
          is_recurring: formData.is_recurring,
          show_on_website: formData.show_on_website,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create");
      }

      toast.success(t("admin.messages.overrideAdded"));
      onOpenChange(false);
      onCreated();
    } catch (error) {
      console.error("Failed to create override:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.misc.overrideCouldNotAdd"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden w-full md:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("admin.misc.addOverride")}</SheetTitle>
          <SheetDescription>
            {t("admin.misc.addOverrideDesc")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            {/* Date selection */}
            <Field>
              <FieldLabel>
                {formData.hasDateRange ? t("admin.labels.startDate") : t("admin.labels.date")}
              </FieldLabel>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={
                  formData.is_recurring
                    ? undefined
                    : new Date().toISOString().split("T")[0]
                }
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </Field>

            {/* Date range toggle */}
            <Field orientation="horizontal">
              <FieldLabel htmlFor="hasDateRange">{t("admin.misc.multipleDays")}</FieldLabel>
              <Switch
                id="hasDateRange"
                checked={formData.hasDateRange}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    hasDateRange: checked,
                    end_date: "",
                  })
                }
              />
            </Field>

            {/* End date (conditional) */}
            {formData.hasDateRange && (
              <Field>
                <FieldLabel>{t("admin.labels.endDate")}</FieldLabel>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  min={
                    formData.date || new Date().toISOString().split("T")[0]
                  }
                  className="[&::-webkit-calendar-picker-indicator]:hidden"
                />
              </Field>
            )}

            {/* Closed toggle */}
            <Field orientation="horizontal">
              <Checkbox
                id="is_closed"
                checked={formData.is_closed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_closed: !!checked })
                }
              />
              <FieldLabel htmlFor="is_closed">{t("admin.misc.fullyClosed")}</FieldLabel>
            </Field>

            {/* Custom hours (conditional) */}
            {!formData.is_closed && (
              <div className="flex gap-4">
                <Field className="flex-1">
                  <FieldLabel>{t("admin.misc.from")}</FieldLabel>
                  <Input
                    type="time"
                    value={formData.open_time}
                    onChange={(e) =>
                      setFormData({ ...formData, open_time: e.target.value })
                    }
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </Field>
                <Field className="flex-1">
                  <FieldLabel>{t("admin.misc.to")}</FieldLabel>
                  <Input
                    type="time"
                    value={formData.close_time}
                    onChange={(e) =>
                      setFormData({ ...formData, close_time: e.target.value })
                    }
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </Field>
              </div>
            )}

            {/* Reason */}
            <Field>
              <FieldLabel>{t("admin.misc.reasonOptional")}</FieldLabel>
              <Input
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder={t("admin.placeholders.holidayVacation")}
              />
            </Field>

            <FieldSeparator />

            {/* Recurring toggle */}
            <Field orientation="horizontal">
              <FieldLabel htmlFor="is_recurring">
                <RefreshCwIcon className="size-4" />
                {t("admin.misc.repeatYearly")}
              </FieldLabel>
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_recurring: checked })
                }
              />
            </Field>

            {/* Show on website toggle */}
            <Field orientation="horizontal">
              <FieldLabel htmlFor="show_on_website">
                <GlobeIcon className="size-4" />
                {t("admin.misc.showOnWebsite")}
              </FieldLabel>
              <Switch
                id="show_on_website"
                checked={formData.show_on_website}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_on_website: checked })
                }
              />
            </Field>
          </FieldGroup>
        </div>

        <SheetFooter>
          <Button onClick={handleCreate} disabled={saving || !formData.date}>
            {saving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            {t("admin.buttons.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
