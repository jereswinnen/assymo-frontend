import type {
  AppointmentSettings,
  DateOverride,
  TimeSlot,
  DateAvailability,
  DaySchedule,
} from "@/types/appointments";
import {
  getAppointmentSettings,
  getDateOverrides,
  getBookedSlots,
} from "./queries";
import {
  generateTimeSlots,
  getDayOfWeek,
  isDateInPast,
  isToday,
  isTimeInPast,
  getDateRange,
  toDateString,
} from "./utils";

/**
 * Check if a date matches an override (handles single dates, ranges, and recurring)
 */
function doesOverrideApply(override: DateOverride, dateStr: string): boolean {
  const checkDate = new Date(dateStr);
  const overrideStart = new Date(override.date);

  // For recurring overrides, match by month and day
  if (override.is_recurring) {
    const checkMonth = checkDate.getMonth();
    const checkDay = checkDate.getDate();
    const overrideMonth = overrideStart.getMonth();
    const overrideDay = overrideStart.getDate();

    if (override.end_date) {
      // Recurring range - check if date falls within month/day range
      const overrideEnd = new Date(override.end_date);
      const overrideEndMonth = overrideEnd.getMonth();
      const overrideEndDay = overrideEnd.getDate();

      // Simple case: same month
      if (overrideMonth === overrideEndMonth) {
        return (
          checkMonth === overrideMonth &&
          checkDay >= overrideDay &&
          checkDay <= overrideEndDay
        );
      }

      // Cross-month range (e.g., Dec 24 - Jan 2)
      // Check if in start month after start day, or end month before end day,
      // or any month in between
      if (checkMonth === overrideMonth && checkDay >= overrideDay) return true;
      if (checkMonth === overrideEndMonth && checkDay <= overrideEndDay) return true;
      // For cross-year ranges like Dec-Jan, check if month is Dec or Jan
      if (overrideMonth > overrideEndMonth) {
        // Wraps around year
        if (checkMonth > overrideMonth || checkMonth < overrideEndMonth) return true;
      }
      return false;
    }

    // Single recurring date
    return checkMonth === overrideMonth && checkDay === overrideDay;
  }

  // Non-recurring: exact date match or within range
  if (override.end_date) {
    const overrideEnd = new Date(override.end_date);
    return checkDate >= overrideStart && checkDate <= overrideEnd;
  }

  // Single date match
  return dateStr === override.date;
}

/**
 * Find the applicable override for a date from a list of overrides
 * Returns the most specific match (exact date > range > recurring)
 */
function findApplicableOverride(
  overrides: DateOverride[],
  dateStr: string
): DateOverride | undefined {
  let exactMatch: DateOverride | undefined;
  let rangeMatch: DateOverride | undefined;
  let recurringMatch: DateOverride | undefined;

  for (const override of overrides) {
    if (!doesOverrideApply(override, dateStr)) continue;

    if (!override.is_recurring && !override.end_date && override.date === dateStr) {
      // Exact date match - highest priority
      exactMatch = override;
    } else if (!override.is_recurring && override.end_date) {
      // Date range match
      rangeMatch = override;
    } else if (override.is_recurring) {
      // Recurring match - lowest priority
      recurringMatch = override;
    }
  }

  return exactMatch || rangeMatch || recurringMatch;
}

/**
 * Get the schedule for a specific date
 * Considers weekly settings and date-specific overrides (including ranges and recurring)
 */
export async function getDaySchedule(date: string): Promise<DaySchedule> {
  const dayOfWeek = getDayOfWeek(date);

  // Get weekly settings
  const allSettings = await getAppointmentSettings();
  const daySetting = allSettings.find((s) => s.day_of_week === dayOfWeek);

  // Check for date-specific override (the query now returns ranges and recurring)
  const overrides = await getDateOverrides(date, date);
  const override = findApplicableOverride(overrides, date);

  // If there's an override, use it
  if (override) {
    if (override.is_closed) {
      return {
        date,
        is_open: false,
        open_time: null,
        close_time: null,
        slot_duration_minutes: daySetting?.slot_duration_minutes ?? 60,
        override_reason: override.reason,
      };
    }

    // Override with custom hours
    return {
      date,
      is_open: true,
      open_time: override.open_time,
      close_time: override.close_time,
      slot_duration_minutes: daySetting?.slot_duration_minutes ?? 60,
      override_reason: override.reason,
    };
  }

  // Use weekly settings
  if (!daySetting || !daySetting.is_open) {
    return {
      date,
      is_open: false,
      open_time: null,
      close_time: null,
      slot_duration_minutes: 60,
    };
  }

  return {
    date,
    is_open: true,
    open_time: daySetting.open_time,
    close_time: daySetting.close_time,
    slot_duration_minutes: daySetting.slot_duration_minutes,
  };
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableSlots(date: string): Promise<TimeSlot[]> {
  // Don't allow booking in the past or same-day
  if (isDateInPast(date) || isToday(date)) {
    return [];
  }

  const schedule = await getDaySchedule(date);

  // If closed, no slots available
  if (!schedule.is_open || !schedule.open_time || !schedule.close_time) {
    return [];
  }

  // Generate all possible time slots
  const allSlots = generateTimeSlots(
    schedule.open_time,
    schedule.close_time,
    schedule.slot_duration_minutes
  );

  // Get already booked slots
  const bookedSlots = await getBookedSlots(date);
  const bookedSet = new Set(bookedSlots.map((t) => t.substring(0, 5))); // Normalize to HH:MM

  // Mark slots as available/unavailable
  const slots: TimeSlot[] = allSlots.map((time) => {
    let available = !bookedSet.has(time);

    // If today, filter out past time slots
    if (isToday(date) && isTimeInPast(time)) {
      available = false;
    }

    return { time, available };
  });

  return slots;
}

/**
 * Check if a specific slot is available
 */
export async function isSlotAvailable(
  date: string,
  time: string
): Promise<boolean> {
  // Check if date is in past or same-day (no same-day bookings allowed)
  if (isDateInPast(date) || isToday(date)) {
    return false;
  }

  const schedule = await getDaySchedule(date);

  // If closed, not available
  if (!schedule.is_open || !schedule.open_time || !schedule.close_time) {
    return false;
  }

  // Check if time is within business hours
  const allSlots = generateTimeSlots(
    schedule.open_time,
    schedule.close_time,
    schedule.slot_duration_minutes
  );

  if (!allSlots.includes(time)) {
    return false;
  }

  // Check if already booked
  const bookedSlots = await getBookedSlots(date);
  const normalizedBooked = bookedSlots.map((t) => t.substring(0, 5));

  return !normalizedBooked.includes(time);
}

/**
 * Get availability for a date range
 * Used by the frontend calendar to show which dates have available slots
 */
export async function getAvailability(
  startDate: string,
  endDate: string
): Promise<DateAvailability[]> {
  // Get all weekly settings
  const settings = await getAppointmentSettings();
  const settingsMap = new Map<number, AppointmentSettings>();
  settings.forEach((s) => settingsMap.set(s.day_of_week, s));

  // Get all overrides in range (includes ranges and recurring)
  const overrides = await getDateOverrides(startDate, endDate);

  // Generate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const dates = getDateRange(start, dayCount);

  // Get all booked slots in range (batch query for performance)
  const allBookedPromises = dates.map((date) => getBookedSlots(date));
  const allBooked = await Promise.all(allBookedPromises);
  const bookedByDate = new Map<string, Set<string>>();
  dates.forEach((date, i) => {
    bookedByDate.set(
      date,
      new Set(allBooked[i].map((t) => t.substring(0, 5)))
    );
  });

  // Build availability for each date
  const availability: DateAvailability[] = [];

  for (const date of dates) {
    // Skip past dates and today (no same-day bookings)
    if (isDateInPast(date) || isToday(date)) {
      availability.push({ date, is_open: false, slots: [] });
      continue;
    }

    const dayOfWeek = getDayOfWeek(date);
    // Find applicable override for this date (handles ranges and recurring)
    const override = findApplicableOverride(overrides, date);
    const daySetting = settingsMap.get(dayOfWeek);

    let isOpen = false;
    let openTime: string | null = null;
    let closeTime: string | null = null;
    let slotDuration = 60;

    // Determine schedule
    if (override) {
      if (override.is_closed) {
        availability.push({ date, is_open: false, slots: [] });
        continue;
      }
      isOpen = true;
      openTime = override.open_time;
      closeTime = override.close_time;
      slotDuration = daySetting?.slot_duration_minutes ?? 60;
    } else if (daySetting && daySetting.is_open) {
      isOpen = true;
      openTime = daySetting.open_time;
      closeTime = daySetting.close_time;
      slotDuration = daySetting.slot_duration_minutes;
    }

    if (!isOpen || !openTime || !closeTime) {
      availability.push({ date, is_open: false, slots: [] });
      continue;
    }

    // Generate slots
    const allSlots = generateTimeSlots(openTime, closeTime, slotDuration);
    const booked = bookedByDate.get(date) ?? new Set<string>();

    const slots: TimeSlot[] = allSlots.map((time) => {
      let available = !booked.has(time);

      // Filter past times for today
      if (isToday(date) && isTimeInPast(time)) {
        available = false;
      }

      return { time, available };
    });

    // Only mark as open if there are available slots
    const hasAvailableSlots = slots.some((s) => s.available);

    availability.push({
      date,
      is_open: hasAvailableSlots,
      slots,
    });
  }

  return availability;
}

/**
 * Get dates that have at least one available slot (for calendar display)
 */
export async function getAvailableDates(
  startDate: string,
  endDate: string
): Promise<string[]> {
  const availability = await getAvailability(startDate, endDate);

  return availability
    .filter((a) => a.is_open && a.slots.some((s) => s.available))
    .map((a) => a.date);
}

/**
 * Get next available date from today
 * Useful for suggesting first available appointment
 */
export async function getNextAvailableDate(
  maxDaysAhead = 60
): Promise<string | null> {
  const today = toDateString(new Date());
  const endDate = toDateString(
    new Date(Date.now() + maxDaysAhead * 24 * 60 * 60 * 1000)
  );

  const availableDates = await getAvailableDates(today, endDate);

  return availableDates[0] ?? null;
}
