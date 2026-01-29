"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Loader2Icon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/config/strings";

interface AppointmentCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function AppointmentCreateSheet({
  open,
  onOpenChange,
  onCreated,
}: AppointmentCreateSheetProps) {
  const [saving, setSaving] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const [formData, setFormData] = useState({
    appointment_time: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_street: "",
    customer_postal_code: "",
    customer_city: "",
    remarks: "",
    admin_notes: "",
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setFormData({
      appointment_time: "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_street: "",
      customer_postal_code: "",
      customer_city: "",
      remarks: "",
      admin_notes: "",
    });
    setSendConfirmation(true);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!selectedDate || !formData.appointment_time) {
      toast.error(t("admin.messages.selectDateTime"));
      return;
    }

    if (
      !formData.customer_name ||
      !formData.customer_email ||
      !formData.customer_phone
    ) {
      toast.error(t("admin.messages.customerDataRequired"));
      return;
    }

    if (
      !formData.customer_street ||
      !formData.customer_postal_code ||
      !formData.customer_city
    ) {
      toast.error(t("admin.messages.addressRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          send_confirmation: sendConfirmation,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create appointment");
      }

      toast.success(t("admin.messages.appointmentCreated"));
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Failed to create appointment:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.dialogs.couldAppointmentNotCreate"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  // Check if required fields are filled
  const isFormValid =
    selectedDate &&
    formData.appointment_time &&
    formData.customer_name.trim() &&
    formData.customer_email.trim() &&
    formData.customer_phone.trim() &&
    formData.customer_street.trim() &&
    formData.customer_postal_code.trim() &&
    formData.customer_city.trim();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden w-full md:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("admin.headings.newAppointment")}</SheetTitle>
          <SheetDescription>
            {t("admin.dialogs.newAppointmentDesc")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            {/* Date and Time */}
            <FieldSet>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>{t("admin.labels.date")}</FieldLabel>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="time">{t("admin.labels.time")}</FieldLabel>
                  <Input
                    id="time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appointment_time: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Customer info and address */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="name">{t("admin.labels.name")}</FieldLabel>
                <Input
                  id="name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  placeholder={t("admin.placeholders.fullName")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="email">{t("admin.labels.email")}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_email: e.target.value,
                      })
                    }
                    placeholder={t("admin.placeholders.emailFormat")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">{t("admin.labels.phoneShort")}</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_phone: e.target.value,
                      })
                    }
                    placeholder={t("admin.placeholders.phoneFormat")}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="street">{t("admin.labels.streetAndNumber")}</FieldLabel>
                <Input
                  id="street"
                  value={formData.customer_street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_street: e.target.value,
                    })
                  }
                  placeholder={t("admin.placeholders.streetFormat")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="postal">{t("admin.labels.postalCode")}</FieldLabel>
                  <Input
                    id="postal"
                    value={formData.customer_postal_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_postal_code: e.target.value,
                      })
                    }
                    placeholder={t("admin.placeholders.postalCode")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="city">{t("admin.labels.place")}</FieldLabel>
                  <Input
                    id="city"
                    value={formData.customer_city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_city: e.target.value,
                      })
                    }
                    placeholder={t("admin.placeholders.city")}
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Optional notes */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="remarks">{t("admin.labels.customerRemarks")}</FieldLabel>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={2}
                  placeholder={t("admin.placeholders.customerRemarks")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="admin_notes">{t("admin.labels.adminNotes")}</FieldLabel>
                <Textarea
                  id="admin_notes"
                  value={formData.admin_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, admin_notes: e.target.value })
                  }
                  rows={2}
                  placeholder={t("admin.placeholders.adminOnly")}
                />
              </Field>
            </FieldSet>

            <FieldSeparator />

            {/* Email option */}
            <Field orientation="horizontal">
              <Checkbox
                id="send_confirmation"
                checked={sendConfirmation}
                onCheckedChange={(checked) => setSendConfirmation(!!checked)}
              />
              <FieldLabel htmlFor="send_confirmation">
                {t("admin.labels.sendConfirmationEmail")}
              </FieldLabel>
            </Field>
          </FieldGroup>
        </div>

        <SheetFooter>
          <Button onClick={handleSubmit} disabled={saving || !isFormValid}>
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
