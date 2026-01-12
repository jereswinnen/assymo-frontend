"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateAvailability, TimeSlot } from "@/types/appointments";
import { DAYS_OF_WEEK } from "@/types/appointments";

interface CalendarProps {
  selectedDate: string | null;
  selectedTime: string | null;
  onDateTimeSelect: (date: string, time: string) => void;
  availability: DateAvailability[];
  loading?: boolean;
  onMonthChange?: (year: number, month: number) => void;
}

export function Calendar({
  selectedDate,
  selectedTime,
  onDateTimeSelect,
  availability,
  loading = false,
  onMonthChange,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [expandedDate, setExpandedDate] = useState<string | null>(selectedDate);
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  // Track previous month to detect actual changes
  const prevMonthRef = useRef({
    year: currentMonth.year,
    month: currentMonth.month,
  });

  // Notify parent when month changes (after render, not during)
  useEffect(() => {
    const prev = prevMonthRef.current;
    if (prev.year !== currentMonth.year || prev.month !== currentMonth.month) {
      prevMonthRef.current = {
        year: currentMonth.year,
        month: currentMonth.month,
      };
      onMonthChange?.(currentMonth.year, currentMonth.month);
    }
  }, [currentMonth.year, currentMonth.month, onMonthChange]);

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
      (currentMonth.year === currentYear &&
        currentMonth.month > currentMonthNum)
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
      slots: TimeSlot[];
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
        slots: [],
      });
    }

    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      // Format as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      // Treat today as past (no same-day bookings)
      const isPast = date <= today;
      const isToday = date.getTime() === today.getTime();
      const dayAvailability = availabilityMap.get(dateStr);
      const slots = dayAvailability?.slots ?? [];
      const hasSlots = slots.some((s) => s.available);
      const isAvailable = !isPast && hasSlots;

      days.push({
        date: dateStr,
        dayNumber: day,
        isToday,
        isPast,
        isAvailable,
        hasSlots,
        slots,
      });
    }

    return days;
  }, [currentMonth, availabilityMap]);

  const monthName = new Date(
    currentMonth.year,
    currentMonth.month,
  ).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  // Get slots for expanded date
  const expandedDateSlots = useMemo(() => {
    if (!expandedDate) return [];
    const dayData = calendarDays.find((d) => d.date === expandedDate);
    return dayData?.slots.filter((s) => s.available) ?? [];
  }, [expandedDate, calendarDays]);

  const handleDateClick = (date: string) => {
    const isExpanding = date !== expandedDate;
    setExpandedDate(isExpanding ? date : null);

    if (isExpanding) {
      // Scroll time slots into view after state update
      setTimeout(() => {
        timeSlotsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (expandedDate) {
      onDateTimeSelect(expandedDate, time);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="mb-0! capitalize">{monthName}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            disabled={!canGoBack}
            aria-label="Vorige maand"
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            aria-label="Volgende maand"
          >
            <ChevronRightIcon className="size-5" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="py-2 grid grid-cols-7 bg-stone-100 rounded-full">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.value}
            className="text-center text-sm font-medium text-stone-700"
          >
            {day.shortName}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8 md:gap-10">
        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-l border-t border-stone-200 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {calendarDays.map((day, index) => {
            const isFullySelected = selectedDate === day.date && selectedTime;
            const isExpanded = expandedDate === day.date;
            const isClickable = day.date && !day.isPast && day.isAvailable;
            const showSelectedStyle = isExpanded || isFullySelected;

            return (
              <button
                key={index}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && handleDateClick(day.date!)}
                className={cn(
                  "aspect-3/2 relative border-r border-b border-stone-200 p-1",
                  "focus:outline-none",
                  !day.date && "bg-transparent",
                  day.date && day.isPast && "bg-stone-50 cursor-not-allowed",
                  day.date &&
                    !day.isPast &&
                    day.isAvailable &&
                    !showSelectedStyle &&
                    "hover:bg-stone-50 cursor-pointer",
                  day.date &&
                    !day.isPast &&
                    !day.isAvailable &&
                    "cursor-not-allowed",
                  showSelectedStyle && "bg-accent-dark",
                )}
              >
                {/* Date number - top right */}
                {day.dayNumber && (
                  <span
                    className={cn(
                      "absolute top-1 right-2 text-sm",
                      day.isPast && "text-stone-300",
                      !day.isPast &&
                        day.isAvailable &&
                        !showSelectedStyle &&
                        "text-stone-800 font-medium",
                      !day.isPast && !day.isAvailable && "text-stone-400",
                      day.isToday &&
                        !showSelectedStyle &&
                        "text-accent-dark font-semibold",
                      showSelectedStyle && "text-accent-light font-semibold",
                    )}
                  >
                    {day.dayNumber}
                  </span>
                )}

                {/* Diagonal line for unavailable (not past) days */}
                {day.date && !day.isPast && !day.isAvailable && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    aria-hidden="true"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[141%] h-px bg-stone-200 origin-center rotate-32" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Time slots for selected date */}
        {expandedDate && (
          <div ref={timeSlotsRef} className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              <p className="mb-0! text-base font-medium text-stone-700">
                Kies een tijdslot
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {expandedDateSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => handleTimeSelect(slot.time)}
                  className={cn(
                    "px-3 py-2.5 rounded-md text-sm font-medium text-stone-700 transition-colors",
                    "focus:outline-none",
                    "border border-stone-200",
                    "hover:border-stone-300 hover:bg-stone-100 cursor-pointer",
                    selectedDate === expandedDate &&
                      selectedTime === slot.time &&
                      "bg-accent-dark text-accent-light border-accent-dark hover:bg-accent-dark",
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
