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
    // Sort appointments by time for each date
    map.forEach((apts, date) => {
      map.set(
        date,
        apts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
      );
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

  // Generate calendar days grouped by weeks
  const calendarWeeks = useMemo(() => {
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
    }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: null,
        dayNumber: null,
        isToday: false,
        isPast: true,
        appointments: [],
      });
    }

    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;
      const isToday = dayDate.getTime() === today.getTime();
      const dayAppointments = appointmentsByDate.get(dateStr) || [];

      days.push({
        date: dateStr,
        dayNumber: day,
        isToday,
        isPast,
        appointments: dayAppointments,
      });
    }

    // Pad end to complete the last week
    while (days.length % 7 !== 0) {
      days.push({
        date: null,
        dayNumber: null,
        isToday: false,
        isPast: true,
        appointments: [],
      });
    }

    // Split into weeks
    const weeks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
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

  const formatTime = (time: string) => time.substring(0, 5);

  return (
    <div className="w-full flex flex-col h-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
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
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.value}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day.shortName}
          </div>
        ))}
      </div>

      {/* Calendar grid - flex-1 to fill available space */}
      <div className="flex-1 flex flex-col border-l border-border relative min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {calendarWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex-1 grid grid-cols-7 min-h-0">
            {week.map((day, dayIndex) => {
              const isClickable = day.date !== null;

              return (
                <button
                  key={dayIndex}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && handleDateClick(day.date!)}
                  className={cn(
                    "relative border-r border-b border-border p-1 text-left flex flex-col overflow-hidden",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    !day.date && "bg-muted/30",
                    day.date && day.isPast && "bg-muted/50",
                    day.date && "hover:bg-muted/80 cursor-pointer",
                  )}
                >
                  {/* Date number */}
                  {day.dayNumber && (
                    <span
                      className={cn(
                        "text-xs mb-0.5",
                        day.isPast && "text-muted-foreground",
                        !day.isPast && "text-foreground font-medium",
                        day.isToday && "text-primary font-semibold",
                      )}
                    >
                      {day.dayNumber}
                    </span>
                  )}

                  {/* Appointment bars */}
                  <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-h-0">
                    {day.appointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={cn(
                          "flex items-center gap-1 text-[10px] leading-tight truncate",
                          apt.status === "cancelled" && "opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-0.5 h-3 rounded-full shrink-0",
                            apt.status === "cancelled"
                              ? "bg-destructive"
                              : "bg-primary"
                          )}
                        />
                        <span className="truncate text-muted-foreground">
                          {apt.customer_name}
                        </span>
                        <span className="shrink-0 text-muted-foreground/70">
                          {formatTime(apt.appointment_time)}
                        </span>
                      </div>
                    ))}
                    {day.appointments.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{day.appointments.length - 3} meer
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
