"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  Loader2Icon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, AppointmentStatus } from "@/types/appointments";
import { STATUS_LABELS } from "@/types/appointments";

interface AppointmentDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AppointmentDialog({
  appointment,
  open,
  onOpenChange,
  onUpdate,
}: AppointmentDialogProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Local copy of appointment data for display (updated after save)
  const [displayData, setDisplayData] = useState<Appointment | null>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    appointment_date: "",
    appointment_time: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_street: "",
    customer_postal_code: "",
    customer_city: "",
    remarks: "",
    status: "confirmed" as AppointmentStatus,
    admin_notes: "",
  });

  // Sync displayData when appointment prop changes
  useEffect(() => {
    if (appointment) {
      setDisplayData(appointment);
    }
  }, [appointment]);

  // Initialize edit data when starting to edit
  const startEditing = () => {
    if (displayData) {
      setEditData({
        appointment_date: displayData.appointment_date,
        appointment_time: displayData.appointment_time.substring(0, 5),
        customer_name: displayData.customer_name,
        customer_email: displayData.customer_email,
        customer_phone: displayData.customer_phone,
        customer_street: displayData.customer_street,
        customer_postal_code: displayData.customer_postal_code,
        customer_city: displayData.customer_city,
        remarks: displayData.remarks || "",
        status: displayData.status,
        admin_notes: displayData.admin_notes || "",
      });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!appointment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          send_notification: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }

      toast.success("Afspraak bijgewerkt");
      // Update local display data with edited values
      setDisplayData((prev) =>
        prev
          ? {
              ...prev,
              ...editData,
              appointment_time: editData.appointment_time + ":00",
            }
          : null
      );
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update appointment:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon afspraak niet bijwerken"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;

    setCancelling(true);
    try {
      const response = await fetch(
        `/api/admin/appointments/${appointment.id}?notify=true`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel");
      }

      toast.success("Afspraak geannuleerd");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon afspraak niet annuleren"
      );
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5) + " uur";
  };

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!appointment || !displayData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Afspraak details
            <Badge variant={getStatusBadgeVariant(displayData.status)}>
              {STATUS_LABELS[displayData.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          // Edit mode
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={editData.appointment_date}
                  onChange={(e) =>
                    setEditData({ ...editData, appointment_date: e.target.value })
                  }
                  className="[&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
              <div className="space-y-2">
                <Label>Tijd</Label>
                <Input
                  type="time"
                  value={editData.appointment_time}
                  onChange={(e) =>
                    setEditData({ ...editData, appointment_time: e.target.value })
                  }
                  className="[&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editData.status}
                onValueChange={(value) =>
                  setEditData({ ...editData, status: value as AppointmentStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Bevestigd</SelectItem>
                  <SelectItem value="completed">Afgerond</SelectItem>
                  <SelectItem value="cancelled">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Naam</Label>
              <Input
                value={editData.customer_name}
                onChange={(e) =>
                  setEditData({ ...editData, customer_name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={editData.customer_email}
                  onChange={(e) =>
                    setEditData({ ...editData, customer_email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefoon</Label>
                <Input
                  value={editData.customer_phone}
                  onChange={(e) =>
                    setEditData({ ...editData, customer_phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Straat en huisnummer</Label>
              <Input
                value={editData.customer_street}
                onChange={(e) =>
                  setEditData({ ...editData, customer_street: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Postcode</Label>
                <Input
                  value={editData.customer_postal_code}
                  onChange={(e) =>
                    setEditData({ ...editData, customer_postal_code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Plaats</Label>
                <Input
                  value={editData.customer_city}
                  onChange={(e) =>
                    setEditData({ ...editData, customer_city: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opmerkingen klant</Label>
              <Textarea
                value={editData.remarks}
                onChange={(e) =>
                  setEditData({ ...editData, remarks: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Interne notities (admin)</Label>
              <Textarea
                value={editData.admin_notes}
                onChange={(e) =>
                  setEditData({ ...editData, admin_notes: e.target.value })
                }
                rows={2}
                placeholder="Alleen zichtbaar voor beheerders..."
              />
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Annuleren
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2Icon className="size-4 animate-spin" />}
                Opslaan
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // View mode
          <div className="space-y-4">
            {/* Date and Time */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CalendarIcon className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {formatDate(displayData.appointment_date)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {formatTime(displayData.appointment_time)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">{displayData.customer_name}</span>
              </div>

              <div className="flex items-center gap-3">
                <MailIcon className="size-4 text-muted-foreground" />
                <a
                  href={`mailto:${displayData.customer_email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {displayData.customer_email}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <PhoneIcon className="size-4 text-muted-foreground" />
                <a
                  href={`tel:${displayData.customer_phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {displayData.customer_phone}
                </a>
              </div>

              <div className="flex items-start gap-3">
                <MapPinIcon className="size-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  {displayData.customer_street}
                  <br />
                  {displayData.customer_postal_code} {displayData.customer_city}
                </div>
              </div>
            </div>

            {/* Remarks */}
            {displayData.remarks && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Opmerkingen</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {displayData.remarks}
                  </p>
                </div>
              </>
            )}

            {/* Admin notes */}
            {displayData.admin_notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">
                    Interne notities
                  </Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap bg-yellow-50 p-2 rounded">
                    {displayData.admin_notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Metadata */}
            <div className="text-xs text-muted-foreground">
              Aangemaakt op{" "}
              {new Date(displayData.created_at).toLocaleString("nl-NL")}
            </div>

            <DialogFooter className="gap-2">
              {displayData.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                >
                  <TrashIcon className="size-4" />
                  Annuleren
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={startEditing}>
                Bewerken
              </Button>
            </DialogFooter>

            {/* Cancel Confirmation Dialog */}
            <Dialog
              open={showCancelConfirm}
              onOpenChange={(open) => !open && setShowCancelConfirm(false)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Afspraak annuleren</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Weet je zeker dat je deze afspraak wilt annuleren? De klant
                  ontvangt hiervan een e-mailnotificatie.
                </p>
                <DialogFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Terug
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling && (
                      <Loader2Icon className="size-4 animate-spin" />
                    )}
                    Ja, annuleren
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
