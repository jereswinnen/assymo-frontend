"use client";

import { useState } from "react";
import {
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  SendIcon,
} from "lucide-react";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";
import { Input } from "@/components/ui/input";

/**
 * Types for tool results
 */
interface AvailableDay {
  date: string;
  date_formatted: string;
  available_times: string[];
}

interface AvailabilityResult {
  success: boolean;
  available_days?: AvailableDay[];
  total_available_slots?: number;
  error?: string;
}

interface BookingResult {
  success: boolean;
  appointment?: {
    date: string;
    time: string;
    customer_name: string;
  };
  edit_url?: string;
  message?: string;
  error?: string;
}

/**
 * Card displaying available appointment slots
 */
export function AvailabilityCard({
  result,
  onSelectSlot,
}: {
  result: AvailabilityResult;
  onSelectSlot?: (date: string, time: string, dateFormatted: string) => void;
}) {
  if (!result.success || !result.available_days?.length) {
    return (
      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
        Geen beschikbare tijden gevonden in deze periode.
      </div>
    );
  }

  return (
    <div className="bg-stone-100 rounded-lg p-3 space-y-3">
      <header className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
        <CalendarDaysIcon className="size-4" />
        <span>Beschikbare tijden</span>
      </header>
      <div className="space-y-2">
        {result.available_days.slice(0, 5).map((day) => (
          <div
            key={day.date}
            className="flex flex-col gap-2 p-2 bg-background rounded-md"
          >
            <div className="text-xs font-medium text-stone-700">
              {day.date_formatted}
            </div>
            <div className="flex flex-wrap gap-1">
              {day.available_times.map((time) => (
                <button
                  key={`${day.date}-${time}`}
                  onClick={() =>
                    onSelectSlot?.(day.date, time, day.date_formatted)
                  }
                  className="px-2 py-1 text-xs font-medium text-stone-800 bg-stone-200 hover:text-stone-700 hover:bg-stone-300 rounded transition-colors cursor-pointer"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card displaying booking confirmation
 */
export function BookingConfirmationCard({ result }: { result: BookingResult }) {
  if (!result.success) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
        <div className="font-medium text-destructive">Boeking mislukt</div>
        <div className="text-muted-foreground mt-1">
          {result.message || result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <CheckCircleIcon className="size-4" />
        <span className="font-medium text-sm">Afspraak bevestigd!</span>
      </div>

      {result.appointment && (
        <div className="text-sm space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-3.5" />
            <span>{result.appointment.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="size-3.5" />
            <span>{result.appointment.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-3.5" />
            <span>{APPOINTMENTS_CONFIG.storeLocation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Form for collecting booking details
 */
export function BookingForm({
  selectedDate,
  selectedTime,
  onSubmit,
}: {
  selectedDate: string;
  selectedTime: string;
  onSubmit: (data: string) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Format as a natural message the AI can parse
    const message = `Mijn gegevens: ${formData.name}, ${formData.email}, ${formData.phone}, ${formData.street}, ${formData.postalCode} ${formData.city}`;
    onSubmit(message);
  };

  const isComplete =
    formData.name &&
    formData.email &&
    formData.phone &&
    formData.street &&
    formData.postalCode &&
    formData.city;

  return (
    <div className="bg-stone-100 rounded-lg p-3 space-y-3">
      <header className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
        <CalendarIcon className="size-4" />
        <span>
          {selectedDate} om {selectedTime}
        </span>
      </header>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder="Naam"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="h-8 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="h-8 text-sm"
          />
          <Input
            type="tel"
            placeholder="Telefoon"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="h-8 text-sm"
          />
        </div>
        <Input
          placeholder="Straat + huisnummer"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="h-8 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Postcode"
            value={formData.postalCode}
            onChange={(e) =>
              setFormData({ ...formData, postalCode: e.target.value })
            }
            className="h-8 text-sm"
          />
          <Input
            placeholder="Plaats"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!isComplete}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          <CheckIcon className="size-4" />
          Bevestig afspraak
        </button>
      </form>
    </div>
  );
}

/**
 * Renders the appropriate card based on tool name and result
 */
export function ToolResultCard({
  toolName,
  result,
  onSelectSlot,
}: {
  toolName: string;
  result: unknown;
  onSelectSlot?: (date: string, time: string, dateFormatted: string) => void;
}) {
  switch (toolName) {
    case "checkAvailability":
      return (
        <AvailabilityCard
          result={result as AvailabilityResult}
          onSelectSlot={onSelectSlot}
        />
      );
    case "createAppointment":
      return <BookingConfirmationCard result={result as BookingResult} />;
    default:
      return null;
  }
}
