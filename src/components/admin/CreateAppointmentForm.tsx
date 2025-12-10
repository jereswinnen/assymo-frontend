"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, CalendarPlusIcon, CheckIcon } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlusIcon className="size-4" />
            Nieuwe afspraak
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) =>
                  setFormData({ ...formData, appointment_date: e.target.value })
                }
                required
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Tijd *</Label>
              <Input
                id="time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) =>
                  setFormData({ ...formData, appointment_time: e.target.value })
                }
                required
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </div>

          <Separator />

          {/* Customer info */}
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              placeholder="Volledige naam"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData({ ...formData, customer_email: e.target.value })
                }
                placeholder="email@voorbeeld.be"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) =>
                  setFormData({ ...formData, customer_phone: e.target.value })
                }
                placeholder="0412 34 56 78"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Straat en huisnummer *</Label>
            <Input
              id="street"
              value={formData.customer_street}
              onChange={(e) =>
                setFormData({ ...formData, customer_street: e.target.value })
              }
              placeholder="Straatnaam 123"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal">Postcode *</Label>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats *</Label>
              <Input
                id="city"
                value={formData.customer_city}
                onChange={(e) =>
                  setFormData({ ...formData, customer_city: e.target.value })
                }
                placeholder="Plaatsnaam"
                required
              />
            </div>
          </div>

          <Separator />

          {/* Optional fields */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Opmerkingen klant</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              rows={2}
              placeholder="Eventuele opmerkingen van de klant..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_notes">Interne notities</Label>
            <Textarea
              id="admin_notes"
              value={formData.admin_notes}
              onChange={(e) =>
                setFormData({ ...formData, admin_notes: e.target.value })
              }
              rows={2}
              placeholder="Alleen zichtbaar voor beheerders..."
            />
          </div>

          <Separator />

          {/* Email option */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="send_confirmation"
              checked={sendConfirmation}
              onCheckedChange={(checked) => setSendConfirmation(!!checked)}
            />
            <Label htmlFor="send_confirmation" className="text-sm">
              Bevestigingsmail naar klant sturen
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={saving || !isFormValid}>
              {saving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Afspraak aanmaken
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
