"use client";

import { useState, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointments";
import { DAYS_OF_WEEK } from "@/types/appointments";

interface AdminAppointmentsCalendarProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  loading?: boolean;
}

export function AdminAppointmentsCalendar({
  appointments,
  onDateClick,
  loading = false,
}: AdminAppointmentsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Create a map of date -> appointments for quick lookup
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const existing = map.get(apt.appointment_date) || [];
      existing.push(apt);
      map.set(apt.appointment_date, existing);
    });
    return map;
  }, [appointments]);

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
      appointments: Appointment[];
      confirmedCount: number;
      cancelledCount: number;
    }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: null,
        dayNumber: null,
        isToday: false,
        isPast: true,
        appointments: [],
        confirmedCount: 0,
        cancelledCount: 0,
      });
    }

    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      // Format as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;
      const isToday = dayDate.getTime() === today.getTime();
      const dayAppointments = appointmentsByDate.get(dateStr) || [];
      const confirmedCount = dayAppointments.filter(
        (a) => a.status === "confirmed" || a.status === "completed"
      ).length;
      const cancelledCount = dayAppointments.filter(
        (a) => a.status === "cancelled"
      ).length;

      days.push({
        date: dateStr,
        dayNumber: day,
        isToday,
        isPast,
        appointments: dayAppointments,
        confirmedCount,
        cancelledCount,
      });
    }

    return days;
  }, [currentMonth, appointmentsByDate]);

  const monthName = new Date(
    currentMonth.year,
    currentMonth.month
  ).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  const handleDateClick = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    onDateClick(date);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="mb-0! capitalize text-lg font-medium">{monthName}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
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
      <div className="py-2 grid grid-cols-7 bg-muted rounded-lg">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.value}
            className="text-center text-sm font-medium text-muted-foreground"
          >
            {day.shortName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-border relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {calendarDays.map((day, index) => {
          const hasConfirmed = day.confirmedCount > 0;
          const hasCancelled = day.cancelledCount > 0;
          const isClickable = day.date !== null;

          return (
            <button
              key={index}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && handleDateClick(day.date!)}
              className={cn(
                "aspect-square relative border-r border-b border-border p-1 min-h-[60px]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                !day.date && "bg-transparent",
                day.date && day.isPast && "bg-muted/50",
                day.date && "hover:bg-muted/80 cursor-pointer",
              )}
            >
              {/* Date number - top right */}
              {day.dayNumber && (
                <span
                  className={cn(
                    "absolute top-1 right-2 text-sm",
                    day.isPast && "text-muted-foreground",
                    !day.isPast && "text-foreground font-medium",
                    day.isToday && "text-primary font-semibold",
                  )}
                >
                  {day.dayNumber}
                </span>
              )}

              {/* Appointment indicators - bottom left */}
              {day.date && (hasConfirmed || hasCancelled) && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {hasConfirmed && (
                    <div className="flex items-center gap-0.5">
                      <div className="size-2 rounded-full bg-primary" />
                      {day.confirmedCount > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {day.confirmedCount}
                        </span>
                      )}
                    </div>
                  )}
                  {hasCancelled && (
                    <div className="flex items-center gap-0.5">
                      <div className="size-2 rounded-full bg-destructive" />
                      {day.cancelledCount > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {day.cancelledCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-primary" />
          <span>Bevestigd/Afgerond</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-destructive" />
          <span>Geannuleerd</span>
        </div>
      </div>
    </div>
  );
}
