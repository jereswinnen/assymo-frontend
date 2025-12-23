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

interface CreateAppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateAppointmentForm({
  open,
  onOpenChange,
  onCreated,
}: CreateAppointmentFormProps) {
  const [saving, setSaving] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);

  const [formData, setFormData] = useState({
    appointment_date: "",
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
    setFormData({
      appointment_date: "",
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
    if (!formData.appointment_date || !formData.appointment_time) {
      toast.error("Selecteer een datum en tijd");
      return;
    }

    if (
      !formData.customer_name ||
      !formData.customer_email ||
      !formData.customer_phone
    ) {
      toast.error("Vul alle verplichte klantgegevens in");
      return;
    }

    if (
      !formData.customer_street ||
      !formData.customer_postal_code ||
      !formData.customer_city
    ) {
      toast.error("Vul het volledige adres in");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          send_confirmation: sendConfirmation,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create appointment");
      }

      toast.success("Afspraak aangemaakt");
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Failed to create appointment:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon afspraak niet aanmaken",
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
    formData.appointment_date &&
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
          <SheetTitle>Nieuwe afspraak</SheetTitle>
          <SheetDescription>
            Maak handmatig een nieuwe afspraak aan voor een klant.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            {/* Date and Time */}
            <FieldSet>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="date">Datum</FieldLabel>
                  <Input
                    id="date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appointment_date: e.target.value,
                      })
                    }
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="time">Tijd</FieldLabel>
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
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Customer info and address */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="name">Naam</FieldLabel>
                <Input
                  id="name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  placeholder="Volledige naam"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
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
                    placeholder="email@voorbeeld.be"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Telefoon</FieldLabel>
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
                    placeholder="0412 34 56 78"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="street">Straat en huisnummer</FieldLabel>
                <Input
                  id="street"
                  value={formData.customer_street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_street: e.target.value,
                    })
                  }
                  placeholder="Straatnaam 123"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="postal">Postcode</FieldLabel>
                  <Input
                    id="postal"
                    value={formData.customer_postal_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_postal_code: e.target.value,
                      })
                    }
                    placeholder="1234"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="city">Plaats</FieldLabel>
                  <Input
                    id="city"
                    value={formData.customer_city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_city: e.target.value,
                      })
                    }
                    placeholder="Plaatsnaam"
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            {/* Optional notes */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="remarks">Opmerkingen klant</FieldLabel>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={2}
                  placeholder="Eventuele opmerkingen van de klant..."
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="admin_notes">Interne notities</FieldLabel>
                <Textarea
                  id="admin_notes"
                  value={formData.admin_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, admin_notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Alleen zichtbaar voor beheerders..."
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
                Bevestigingsmail naar klant sturen
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
            Opslaan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
