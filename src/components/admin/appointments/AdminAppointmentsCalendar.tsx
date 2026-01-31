"use client";

import { useState, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointments";
import { DAYS_OF_WEEK } from "@/types/appointments";

type CalendarView = "month" | "week";

interface AdminAppointmentsCalendarProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  loading?: boolean;
}

// Get Monday of the week containing the given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format date as YYYY-MM-DD
function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AdminAppointmentsCalendar({
  appointments,
  onDateClick,
  onAppointmentClick,
  loading = false,
}: AdminAppointmentsCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Handle date selection from the popover calendar
  const handleDatePickerSelect = (date: Date | undefined) => {
    if (!date) return;

    if (viewMode === "month") {
      setCurrentMonth({ year: date.getFullYear(), month: date.getMonth() });
    } else {
      setCurrentWeekStart(getWeekStart(date));
    }
    setDatePickerOpen(false);
  };

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

  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentMonth((prev) => {
        let newYear = prev.year;
        let newMonth = prev.month - 1;
        if (newMonth < 0) {
          newYear = prev.year - 1;
          newMonth = 11;
        }
        return { year: newYear, month: newMonth };
      });
    } else {
      setCurrentWeekStart((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
      });
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentMonth((prev) => {
        let newYear = prev.year;
        let newMonth = prev.month + 1;
        if (newMonth > 11) {
          newYear = prev.year + 1;
          newMonth = 0;
        }
        return { year: newYear, month: newMonth };
      });
    } else {
      setCurrentWeekStart((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
      });
    }
  };

  // Generate calendar days grouped by weeks (for month view)
  const calendarWeeks = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Array<{
      date: string | null;
      dayNumber: number | null;
      isToday: boolean;
      isPast: boolean;
      appointments: Appointment[];
    }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: null,
        dayNumber: null,
        isToday: false,
        isPast: true,
        appointments: [],
      });
    }

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

    while (days.length % 7 !== 0) {
      days.push({
        date: null,
        dayNumber: null,
        isToday: false,
        isPast: true,
        appointments: [],
      });
    }

    const weeks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  }, [currentMonth, appointmentsByDate]);

  // Generate week days (for week view)
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Array<{
      date: string;
      dayDate: Date;
      dayNumber: number;
      monthShort: string;
      isToday: boolean;
      isPast: boolean;
      appointments: Appointment[];
    }> = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(currentWeekStart.getDate() + i);
      const dateStr = formatDateStr(dayDate);
      const isPast = dayDate < today;
      const isToday = dayDate.getTime() === today.getTime();
      const dayAppointments = appointmentsByDate.get(dateStr) || [];

      days.push({
        date: dateStr,
        dayDate,
        dayNumber: dayDate.getDate(),
        monthShort: dayDate.toLocaleDateString("nl-NL", { month: "short" }),
        isToday,
        isPast,
        appointments: dayAppointments,
      });
    }

    return days;
  }, [currentWeekStart, appointmentsByDate]);

  // Format header label based on view mode
  const headerLabel = useMemo(() => {
    if (viewMode === "month") {
      return new Date(currentMonth.year, currentMonth.month).toLocaleDateString(
        "nl-NL",
        { month: "long", year: "numeric" }
      );
    } else {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startDay = currentWeekStart.getDate();
      const endDay = weekEnd.getDate();
      const startMonth = currentWeekStart.toLocaleDateString("nl-NL", { month: "short" });
      const endMonth = weekEnd.toLocaleDateString("nl-NL", { month: "short" });
      const year = weekEnd.getFullYear();

      if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
        return `${startDay} - ${endDay} ${startMonth} ${year}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
      }
    }
  }, [viewMode, currentMonth, currentWeekStart]);

  const handleDateClick = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    onDateClick(date);
  };

  const formatTime = (time: string) => time.substring(0, 5);

  const renderAppointmentBar = (apt: Appointment) => (
    <div
      key={apt.id}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onAppointmentClick(apt);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onAppointmentClick(apt);
        }
      }}
      className={cn(
        "flex items-center gap-1 text-xs leading-tight rounded px-0.5 -mx-0.5 hover:bg-foreground/10 cursor-pointer transition-colors",
        apt.status === "cancelled" && "opacity-50"
      )}
    >
      <div
        className={cn(
          "w-0.5 h-4 rounded-full shrink-0",
          apt.status === "cancelled" ? "bg-destructive" : "bg-primary"
        )}
      />
      <span className="truncate flex-1 text-muted-foreground">
        {apt.customer_name}
      </span>
      <span className="shrink-0 text-foreground/70">
        {formatTime(apt.appointment_time)}
      </span>
    </div>
  );

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header with navigation and view toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={goToPrevious}
            aria-label={viewMode === "month" ? "Vorige maand" : "Vorige week"}
            className="rounded-r-none border-r-0"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-none capitalize min-w-40"
              >
                {headerLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                defaultMonth={
                  viewMode === "month"
                    ? new Date(currentMonth.year, currentMonth.month)
                    : currentWeekStart
                }
                onSelect={handleDatePickerSelect}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="secondary"
            size="sm"
            onClick={goToNext}
            aria-label={viewMode === "month" ? "Volgende maand" : "Volgende week"}
            className="rounded-l-none border-l-0"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as CalendarView)}
        >
          <TabsList>
            <TabsTrigger value="month">Maand</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>
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

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col border-l border-border relative min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Month view */}
        {viewMode === "month" &&
          calendarWeeks.map((week, weekIndex) => (
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
                      day.date && "hover:bg-muted/80 cursor-pointer"
                    )}
                  >
                    {day.dayNumber && (
                      <span
                        className={cn(
                          "text-sm mb-0.5",
                          day.isPast && "text-muted-foreground",
                          !day.isPast && "text-foreground font-medium",
                          day.isToday && "text-primary font-semibold"
                        )}
                      >
                        {day.dayNumber}
                      </span>
                    )}

                    <div className="flex-1 flex flex-col gap-1 overflow-hidden min-h-0">
                      {day.appointments.slice(0, 3).map(renderAppointmentBar)}
                      {day.appointments.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{day.appointments.length - 3} meer
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

        {/* Week view */}
        {viewMode === "week" && (
          <div className="flex-1 grid grid-cols-7 min-h-0">
            {weekDays.map((day, dayIndex) => (
              <button
                key={dayIndex}
                type="button"
                onClick={() => handleDateClick(day.date)}
                className={cn(
                  "relative border-r border-b border-border p-2 text-left flex flex-col overflow-hidden",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  day.isPast && "bg-muted/50",
                  "hover:bg-muted/80 cursor-pointer"
                )}
              >
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className={cn(
                      "text-lg font-medium",
                      day.isPast && "text-muted-foreground",
                      !day.isPast && "text-foreground",
                      day.isToday && "text-primary font-semibold"
                    )}
                  >
                    {day.dayNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {day.monthShort}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
                  {day.appointments.map(renderAppointmentBar)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
