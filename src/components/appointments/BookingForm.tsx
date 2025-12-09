"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "./Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  CalendarIcon,
  MapPinIcon,
  CheckIcon,
  Loader2Icon,
  CalendarClockIcon,
  CircleUserRoundIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DateAvailability } from "@/types/appointments";
import { formatDateNL } from "@/lib/appointments/utils";

type FormStep = "datetime" | "details" | "confirm";

interface FormData {
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_street: string;
  customer_postal_code: string;
  customer_city: string;
  remarks: string;
}

const initialFormData: FormData = {
  appointment_date: "",
  appointment_time: "",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_street: "",
  customer_postal_code: "",
  customer_city: "",
  remarks: "",
};

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
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </>
  );
}

interface BookingFormProps {
  className?: string;
}

export function BookingForm({
  className,
}: BookingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("datetime");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [availability, setAvailability] = useState<DateAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability for a month range
  const fetchAvailability = useCallback(async (year: number, month: number) => {
    setLoadingAvailability(true);
    try {
      // Get first day of month
      const startDate = new Date(year, month, 1);
      // Get last day of month
      const endDate = new Date(year, month + 1, 0);

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const response = await fetch(
        `/api/appointments/availability?start_date=${startStr}&end_date=${endStr}`,
      );

      if (!response.ok) {
        throw new Error("Kon beschikbaarheid niet laden");
      }

      const data = await response.json();
      setAvailability(data.dates || []);
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      toast.error("Kon beschikbaarheid niet laden");
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const now = new Date();
    fetchAvailability(now.getFullYear(), now.getMonth());
  }, [fetchAvailability]);

  const handleDateTimeSelect = (date: string, time: string) => {
    setFormData((prev) => ({
      ...prev,
      appointment_date: date,
      appointment_time: time,
    }));
    setCurrentStep("details");
  };

  const handleMonthChange = (year: number, month: number) => {
    fetchAvailability(year, month);
  };

  const updateField = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isDetailsValid = () => {
    return (
      formData.customer_name.trim() !== "" &&
      formData.customer_email.trim() !== "" &&
      formData.customer_phone.trim() !== "" &&
      formData.customer_street.trim() !== "" &&
      formData.customer_postal_code.trim() !== "" &&
      formData.customer_city.trim() !== ""
    );
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDetailsValid()) {
      setCurrentStep("confirm");
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kon afspraak niet aanmaken");
      }

      // Redirect to appointment page with success status (relative URL for correct domain)
      router.push(`/afspraak/${data.appointment.edit_token}?status=booked`);
    } catch (err) {
      console.error("Failed to create appointment:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Er is iets misgegaan. Probeer opnieuw.",
      );
      toast.error(
        err instanceof Error ? err.message : "Kon afspraak niet aanmaken",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep === "details") setCurrentStep("datetime");
    else if (currentStep === "confirm") setCurrentStep("details");
  };

  const steps = [
    { id: "datetime", label: "Datum & tijd", icon: CalendarClockIcon },
    { id: "details", label: "Gegevens", icon: CircleUserRoundIcon },
    { id: "confirm", label: "Bevestigen", icon: CheckIcon },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Progress steps */}
      <div className="flex gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex-1 flex flex-col gap-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  isCompleted && "text-accent-dark",
                  isActive && "text-stone-800 font-medium",
                  !isActive && !isCompleted && "text-stone-600 font-normal",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              <div
                className={cn(
                  "h-0.5",
                  isCompleted && "bg-accent-light",
                  isActive && "bg-stone-500",
                  !isActive && !isCompleted && "bg-stone-200",
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-card rounded-xl border p-6">
        {/* Date & time selection */}
        {currentStep === "datetime" && (
          <div>
            <h2 className="text-lg! font-medium! mb-4">Kies een datum en tijd</h2>
            <Calendar
              selectedDate={formData.appointment_date}
              selectedTime={formData.appointment_time}
              onDateTimeSelect={handleDateTimeSelect}
              availability={availability}
              loading={loadingAvailability}
              onMonthChange={handleMonthChange}
            />
          </div>
        )}

        {/* Customer details */}
        {currentStep === "details" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg! font-medium!">Uw gegevens</h2>
              <Button variant="ghost" size="sm" onClick={goBack}>
                Wijzig datum/tijd
              </Button>
            </div>
            <p className="text-muted-foreground mb-6">
              {formatDateNL(formData.appointment_date)} om{" "}
              <span className="font-medium text-foreground">
                {formData.appointment_time} uur
              </span>
            </p>

            <form onSubmit={handleDetailsSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="customer_name">
                    <RequiredLabel required>Naam</RequiredLabel>
                  </FieldLabel>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      updateField("customer_name", e.target.value)
                    }
                    placeholder="Volledige naam"
                    required
                    autoComplete="name"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="customer_email">
                      <RequiredLabel required>E-mailadres</RequiredLabel>
                    </FieldLabel>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) =>
                        updateField("customer_email", e.target.value)
                      }
                      placeholder="email@voorbeeld.be"
                      required
                      autoComplete="email"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="customer_phone">
                      <RequiredLabel required>Telefoonnummer</RequiredLabel>
                    </FieldLabel>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) =>
                        updateField("customer_phone", e.target.value)
                      }
                      placeholder="0412 34 56 78"
                      required
                      autoComplete="tel"
                    />
                  </Field>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinIcon className="size-4" />
                  <span className="text-sm font-medium">Adresgegevens</span>
                </div>

                <Field>
                  <FieldLabel htmlFor="customer_street">
                    <RequiredLabel required>Straat en huisnummer</RequiredLabel>
                  </FieldLabel>
                  <Input
                    id="customer_street"
                    value={formData.customer_street}
                    onChange={(e) =>
                      updateField("customer_street", e.target.value)
                    }
                    placeholder="Straatnaam 123"
                    required
                    autoComplete="street-address"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="customer_postal_code">
                      <RequiredLabel required>Postcode</RequiredLabel>
                    </FieldLabel>
                    <Input
                      id="customer_postal_code"
                      value={formData.customer_postal_code}
                      onChange={(e) =>
                        updateField("customer_postal_code", e.target.value)
                      }
                      placeholder="1234"
                      required
                      autoComplete="postal-code"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="customer_city">
                      <RequiredLabel required>Plaats</RequiredLabel>
                    </FieldLabel>
                    <Input
                      id="customer_city"
                      value={formData.customer_city}
                      onChange={(e) =>
                        updateField("customer_city", e.target.value)
                      }
                      placeholder="Plaatsnaam"
                      required
                      autoComplete="address-level2"
                    />
                  </Field>
                </div>

                <Separator />

                <Field>
                  <FieldLabel htmlFor="remarks">
                    Opmerkingen (optioneel)
                  </FieldLabel>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => updateField("remarks", e.target.value)}
                    placeholder="Eventuele opmerkingen of vragen..."
                    rows={3}
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={!isDetailsValid()}
                  className="w-full sm:w-auto"
                >
                  Doorgaan naar bevestiging
                </Button>
              </FieldGroup>
            </form>
          </div>
        )}

        {/* Confirmation */}
        {currentStep === "confirm" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg! font-medium!">Bevestig uw afspraak</h2>
              <Button variant="ghost" size="sm" onClick={goBack}>
                Wijzig gegevens
              </Button>
            </div>

            <div className="space-y-6">
              {/* Appointment summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {formatDateNL(formData.appointment_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.appointment_time} uur
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer info summary */}
              <div className="space-y-3">
                <h3 className="font-medium">Uw gegevens</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Naam:</span>{" "}
                    {formData.customer_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">E-mail:</span>{" "}
                    {formData.customer_email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Telefoon:</span>{" "}
                    {formData.customer_phone}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Adres:</span>{" "}
                    {formData.customer_street}, {formData.customer_postal_code}{" "}
                    {formData.customer_city}
                  </p>
                  {formData.remarks && (
                    <p>
                      <span className="text-muted-foreground">
                        Opmerkingen:
                      </span>{" "}
                      {formData.remarks}
                    </p>
                  )}
                </div>
              </div>

              {error && <FieldError>{error}</FieldError>}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Bezig met aanmaken...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="size-4" />
                      Afspraak bevestigen
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={submitting}
                >
                  Terug
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Na het bevestigen ontvangt u een e-mail met de details van uw
                afspraak en een link om deze te wijzigen of te annuleren.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
