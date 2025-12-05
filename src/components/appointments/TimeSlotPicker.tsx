"use client";

import { cn } from "@/lib/utils";
import { ClockIcon } from "lucide-react";
import type { TimeSlot } from "@/types/appointments";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  disabled?: boolean;
}

export function TimeSlotPicker({
  slots,
  selectedTime,
  onTimeSelect,
  disabled = false,
}: TimeSlotPickerProps) {
  const availableSlots = slots.filter((slot) => slot.available);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClockIcon className="size-8 mx-auto mb-2 opacity-50" />
        <p>Selecteer eerst een datum</p>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClockIcon className="size-8 mx-auto mb-2 opacity-50" />
        <p>Geen beschikbare tijden op deze dag</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {availableSlots.length} {availableSlots.length === 1 ? "tijdslot" : "tijdsloten"} beschikbaar
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            disabled={disabled || !slot.available}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            className={cn(
              "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "border",
              !slot.available && "bg-muted text-muted-foreground/40 cursor-not-allowed border-transparent",
              slot.available && "hover:border-accent-dark hover:bg-accent-light/10 cursor-pointer border-border",
              selectedTime === slot.time && slot.available && "bg-accent-dark text-accent-light border-accent-dark hover:bg-accent-dark"
            )}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
}
