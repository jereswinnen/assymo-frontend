"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateAvailability } from "@/types/appointments";
import { DAYS_OF_WEEK } from "@/types/appointments";

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  availability: DateAvailability[];
  loading?: boolean;
  onMonthChange?: (year: number, month: number) => void;
}

export function DatePicker({
  selectedDate,
  onDateSelect,
  availability,
  loading = false,
  onMonthChange,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Create a map of date -> availability for quick lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, DateAvailability>();
    availability.forEach((a) => map.set(a.date, a));
    return map;
  }, [availability]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      let newYear = prev.year;
      let newMonth = prev.month - 1;
      if (newMonth < 0) {
        newYear = prev.year - 1;
        newMonth = 11;
      }
      onMonthChange?.(newYear, newMonth);
      return { year: newYear, month: newMonth };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      let newYear = prev.year;
      let newMonth = prev.month + 1;
      if (newMonth > 11) {
        newYear = prev.year + 1;
        newMonth = 0;
      }
      onMonthChange?.(newYear, newMonth);
      return { year: newYear, month: newMonth };
    });
  };

  // Check if previous month button should be disabled (can't go before current month)
  const canGoBack = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();
    return (
      currentMonth.year > currentYear ||
      (currentMonth.year === currentYear && currentMonth.month > currentMonthNum)
    );
  }, [currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (convert to Monday=0)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Array<{
      date: string | null;
      dayNumber: number | null;
      isToday: boolean;
      isPast: boolean;
      isAvailable: boolean;
      hasSlots: boolean;
    }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: null,
        dayNumber: null,
        isToday: false,
        isPast: true,
        isAvailable: false,
        hasSlots: false,
      });
    }

    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      // Format as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const dayAvailability = availabilityMap.get(dateStr);
      const hasSlots = dayAvailability?.slots?.some((s) => s.available) ?? false;
      const isAvailable = !isPast && hasSlots;

      days.push({
        date: dateStr,
        dayNumber: day,
        isToday,
        isPast,
        isAvailable,
        hasSlots,
      });
    }

    return days;
  }, [currentMonth, availabilityMap]);

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString(
    "nl-NL",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={!canGoBack}
          aria-label="Vorige maand"
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {monthName}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          aria-label="Volgende maand"
        >
          <ChevronRightIcon className="size-5" />
        </Button>
      </div>

      {/* Day headers (Monday first) */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.value}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day.shortName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {calendarDays.map((day, index) => (
          <button
            key={index}
            type="button"
            disabled={!day.date || day.isPast || !day.isAvailable}
            onClick={() => day.date && day.isAvailable && onDateSelect(day.date)}
            className={cn(
              "aspect-square flex items-center justify-center rounded-lg text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              !day.date && "invisible",
              day.date && day.isPast && "text-muted-foreground/40 cursor-not-allowed",
              day.date && !day.isPast && !day.isAvailable && "text-muted-foreground/60 cursor-not-allowed",
              day.date && day.isAvailable && "hover:bg-accent-light/20 cursor-pointer font-medium",
              day.date && day.isAvailable && "text-foreground",
              day.isToday && "ring-1 ring-accent-dark",
              selectedDate === day.date && day.isAvailable && "bg-accent-dark text-accent-light hover:bg-accent-dark"
            )}
          >
            {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-accent-dark" />
          <span>Geselecteerd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded ring-1 ring-accent-dark" />
          <span>Vandaag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-muted" />
          <span>Niet beschikbaar</span>
        </div>
      </div>
    </div>
  );
}
