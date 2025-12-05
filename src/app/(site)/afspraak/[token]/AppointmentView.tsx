"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  EditIcon,
  Trash2Icon,
  Loader2Icon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  PublicAppointmentView,
  AppointmentStatus,
} from "@/types/appointments";
import { STATUS_LABELS } from "@/types/appointments";
import { formatDateNL, formatTimeNL } from "@/lib/appointments/utils";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";
import Link from "next/link";

interface AppointmentViewProps {
  token: string;
}

export function AppointmentView({ token }: AppointmentViewProps) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<PublicAppointmentView | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_street: "",
    customer_postal_code: "",
    customer_city: "",
    remarks: "",
  });

  const fetchAppointment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Afspraak niet gevonden");
        }
        throw new Error("Kon afspraak niet laden");
      }

      const data = await response.json();
      setAppointment(data.appointment);
      setEditData({
        customer_name: data.appointment.customer_name,
        customer_email: data.appointment.customer_email,
        customer_phone: data.appointment.customer_phone,
        customer_street: data.appointment.customer_street,
        customer_postal_code: data.appointment.customer_postal_code,
        customer_city: data.appointment.customer_city,
        remarks: data.appointment.remarks || "",
      });
    } catch (err) {
      console.error("Failed to fetch appointment:", err);
      setError(err instanceof Error ? err.message : "Kon afspraak niet laden");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/appointments/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kon wijzigingen niet opslaan");
      }

      toast.success("Wijzigingen opgeslagen");
      setEditing(false);
      fetchAppointment();
    } catch (err) {
      console.error("Failed to save appointment:", err);
      toast.error(
        err instanceof Error ? err.message : "Kon wijzigingen niet opslaan",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);

    try {
      const response = await fetch(`/api/appointments/${token}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kon afspraak niet annuleren");
      }

      toast.success("Afspraak geannuleerd");
      router.push("/afspraak/geannuleerd");
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      toast.error(
        err instanceof Error ? err.message : "Kon afspraak niet annuleren",
      );
      setCancelling(false);
      setShowCancelConfirm(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangleIcon className="size-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Afspraak niet gevonden</h1>
        <p className="text-muted-foreground mb-6">
          {error || "Deze afspraak bestaat niet of is verlopen."}
        </p>
        <Button asChild>
          <Link href="/afspraak">Nieuwe afspraak maken</Link>
        </Button>
      </div>
    );
  }

  const isCancelled = appointment.status === "cancelled";
  const isPast =
    new Date(appointment.appointment_date) <
    new Date(new Date().toDateString());

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Uw afspraak</h1>
        <p className="text-muted-foreground">
          Bekijk, wijzig of annuleer uw afspraak hieronder.
        </p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Header with status */}
        <div className="bg-muted/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="size-5 text-muted-foreground" />
            <span className="font-medium">Afspraakdetails</span>
          </div>
          <Badge variant={getStatusBadgeVariant(appointment.status)}>
            {STATUS_LABELS[appointment.status]}
          </Badge>
        </div>

        <div className="p-6 space-y-6">
          {/* Cancelled notice */}
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              Deze afspraak is geannuleerd en kan niet meer worden gewijzigd.
            </div>
          )}

          {/* Date and time */}
          <div className="bg-accent-light/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="size-5 text-accent-dark mt-0.5" />
              <div>
                <p className="font-semibold text-lg">
                  {formatDateNL(appointment.appointment_date)}
                </p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ClockIcon className="size-4" />
                  <span>{formatTimeNL(appointment.appointment_time)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPinIcon className="size-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Locatie</p>
              <p className="text-sm text-muted-foreground">
                {APPOINTMENTS_CONFIG.storeLocation}
              </p>
            </div>
          </div>

          <Separator />

          {/* Customer info - View or Edit mode */}
          {editing ? (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <UserIcon className="size-4" />
                Uw gegevens bewerken
              </h3>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edit_name">Naam</FieldLabel>
                  <Input
                    id="edit_name"
                    value={editData.customer_name}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit_email">E-mail</FieldLabel>
                    <Input
                      id="edit_email"
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
                    <FieldLabel htmlFor="edit_phone">Telefoon</FieldLabel>
                    <Input
                      id="edit_phone"
                      type="tel"
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
                  <FieldLabel htmlFor="edit_street">
                    Straat en huisnummer
                  </FieldLabel>
                  <Input
                    id="edit_street"
                    value={editData.customer_street}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        customer_street: e.target.value,
                      })
                    }
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit_postal">Postcode</FieldLabel>
                    <Input
                      id="edit_postal"
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
                    <FieldLabel htmlFor="edit_city">Plaats</FieldLabel>
                    <Input
                      id="edit_city"
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

                <Field>
                  <FieldLabel htmlFor="edit_remarks">Opmerkingen</FieldLabel>
                  <Textarea
                    id="edit_remarks"
                    value={editData.remarks}
                    onChange={(e) =>
                      setEditData({ ...editData, remarks: e.target.value })
                    }
                    rows={3}
                  />
                </Field>
              </FieldGroup>

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <CheckIcon className="size-4" />
                  )}
                  Opslaan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Annuleren
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <UserIcon className="size-4" />
                Uw gegevens
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span>{appointment.customer_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span>{appointment.customer_email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="size-4 text-muted-foreground" />
                  <span>{appointment.customer_phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="size-4 text-muted-foreground mt-0.5" />
                  <span>
                    {appointment.customer_street}
                    <br />
                    {appointment.customer_postal_code}{" "}
                    {appointment.customer_city}
                  </span>
                </div>
                {appointment.remarks && (
                  <div className="pt-2">
                    <p className="text-muted-foreground mb-1">Opmerkingen:</p>
                    <p className="bg-muted/50 rounded p-2">
                      {appointment.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isCancelled && !isPast && !editing && (
            <>
              <Separator />

              {showCancelConfirm ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-red-800 mb-3">
                    Weet u zeker dat u deze afspraak wilt annuleren?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                      Ja, annuleren
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={cancelling}
                    >
                      Nee, behouden
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setEditing(true)}>
                    <EditIcon className="size-4" />
                    Gegevens wijzigen
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <Trash2Icon className="size-4" />
                    Afspraak annuleren
                  </Button>
                </div>
              )}
            </>
          )}

          {isPast && !isCancelled && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              Deze afspraak heeft al plaatsgevonden en kan niet meer worden
              gewijzigd.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
