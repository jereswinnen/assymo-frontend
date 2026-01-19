"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  Loader2Icon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, AppointmentStatus } from "@/types/appointments";
import { STATUS_LABELS } from "@/types/appointments";
import { t } from "@/config/strings";

interface AppointmentEditSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AppointmentEditSheet({
  appointment,
  open,
  onOpenChange,
  onUpdate,
}: AppointmentEditSheetProps) {
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

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setEditing(false);
    }
  }, [open]);

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

      toast.success(t("admin.messages.appointmentUpdated"));
      // Update local display data with edited values
      setDisplayData((prev) =>
        prev
          ? {
              ...prev,
              ...editData,
              appointment_time: editData.appointment_time + ":00",
            }
          : null,
      );
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update appointment:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.misc.appointmentCouldNotUpdate"),
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
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel");
      }

      toast.success(t("admin.messages.appointmentCancelled"));
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.misc.appointmentCouldNotCancel"),
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="px-4 w-full md:max-w-xl overflow-y-auto"
        >
          <SheetHeader className="px-0">
            <SheetTitle className="flex items-center gap-2">
              {t("admin.misc.appointmentDetails")}
              <Badge variant={getStatusBadgeVariant(displayData.status)}>
                {STATUS_LABELS[displayData.status]}
              </Badge>
            </SheetTitle>
            <SheetDescription>
              {editing
                ? t("admin.misc.editAppointmentDesc")
                : t("admin.misc.viewAppointmentDesc")}
            </SheetDescription>
          </SheetHeader>

          {editing ? (
            // Edit mode
            <FieldGroup>
              {/* Date, time, status */}
              <FieldSet>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit-date">{t("admin.labels.date")}</FieldLabel>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editData.appointment_date}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          appointment_date: e.target.value,
                        })
                      }
                      className="[&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-time">{t("admin.labels.time")}</FieldLabel>
                    <Input
                      id="edit-time"
                      type="time"
                      value={editData.appointment_time}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          appointment_time: e.target.value,
                        })
                      }
                      className="[&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="edit-status">Status</FieldLabel>
                  <Select
                    value={editData.status}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        status: value as AppointmentStatus,
                      })
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldSet>

              <FieldSeparator />

              {/* Customer info */}
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="edit-name">{t("admin.labels.name")}</FieldLabel>
                  <Input
                    id="edit-name"
                    value={editData.customer_name}
                    onChange={(e) =>
                      setEditData({ ...editData, customer_name: e.target.value })
                    }
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit-email">{t("admin.labels.email")}</FieldLabel>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editData.customer_email}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          customer_email: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-phone">{t("admin.labels.phone")}</FieldLabel>
                    <Input
                      id="edit-phone"
                      value={editData.customer_phone}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          customer_phone: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="edit-street">
                    {t("admin.labels.streetAddress")}
                  </FieldLabel>
                  <Input
                    id="edit-street"
                    value={editData.customer_street}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customer_street: e.target.value,
                      })
                    }
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit-postal">{t("admin.labels.postalCode")}</FieldLabel>
                    <Input
                      id="edit-postal"
                      value={editData.customer_postal_code}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          customer_postal_code: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-city">{t("admin.labels.city")}</FieldLabel>
                    <Input
                      id="edit-city"
                      value={editData.customer_city}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          customer_city: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </FieldSet>

              <FieldSeparator />

              {/* Notes */}
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="edit-remarks">
                    {t("admin.labels.customerRemarks")}
                  </FieldLabel>
                  <Textarea
                    id="edit-remarks"
                    value={editData.remarks}
                    onChange={(e) =>
                      setEditData({ ...editData, remarks: e.target.value })
                    }
                    rows={2}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-admin-notes">
                    {t("admin.labels.internalNotes")}
                  </FieldLabel>
                  <Textarea
                    id="edit-admin-notes"
                    value={editData.admin_notes}
                    onChange={(e) =>
                      setEditData({ ...editData, admin_notes: e.target.value })
                    }
                    rows={2}
                    placeholder={t("admin.placeholders.adminOnly")}
                  />
                </Field>
              </FieldSet>
            </FieldGroup>
          ) : (
            // View mode
            <div className="space-y-5 py-4">
              {/* Date and Time */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center size-10 rounded-full bg-background">
                  <CalendarIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">
                    {formatDate(displayData.appointment_date)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(displayData.appointment_time)}
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("admin.labels.customer")}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <UserIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium">{displayData.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MailIcon className="size-4 text-muted-foreground" />
                    <a
                      href={`mailto:${displayData.customer_email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {displayData.customer_email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="size-4 text-muted-foreground" />
                    <a
                      href={`tel:${displayData.customer_phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {displayData.customer_phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("admin.labels.address")}
                </h4>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${displayData.customer_street}, ${displayData.customer_postal_code} ${displayData.customer_city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <MapPinIcon className="size-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm group-hover:text-primary">
                    {displayData.customer_street}
                    <br />
                    {displayData.customer_postal_code} {displayData.customer_city}
                  </div>
                </a>
              </div>

              {/* Remarks */}
              {displayData.remarks && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("admin.misc.remarks")}
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {displayData.remarks}
                  </p>
                </div>
              )}

              {/* Admin notes */}
              {displayData.admin_notes && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("admin.labels.internalNotes")}
                  </h4>
                  <p className="text-sm whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    {displayData.admin_notes}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <Separator />
              <div className="text-xs text-muted-foreground">
                {t("admin.misc.createdOn")}{" "}
                {new Date(displayData.created_at).toLocaleString("nl-NL")}
              </div>
            </div>
          )}

          <SheetFooter className="px-0">
            {editing ? (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <CheckIcon className="size-4" />
                )}
                {t("admin.buttons.save")}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing}>
                  <PencilIcon className="size-4" />
                  {t("admin.buttons.edit")}
                </Button>
                {displayData.status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={cancelling}
                  >
                    <TrashIcon className="size-4" />
                    {t("admin.misc.cancelAppointment")}
                  </Button>
                )}
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation */}
      <AlertDialog
        open={showCancelConfirm}
        onOpenChange={(open) => !open && setShowCancelConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.cancelAppointmentQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.cancelAppointmentDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{t("admin.buttons.back")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling && <Loader2Icon className="size-4 animate-spin" />}
              {t("admin.misc.yesCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
