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
 * Get the schedule for a specific date
 * Considers weekly settings and date-specific overrides
 */
export async function getDaySchedule(date: string): Promise<DaySchedule> {
  const dayOfWeek = getDayOfWeek(date);

  // Get weekly settings
  const allSettings = await getAppointmentSettings();
  const daySetting = allSettings.find((s) => s.day_of_week === dayOfWeek);

  // Check for date-specific override
  const overrides = await getDateOverrides(date, date);
  const override = overrides[0];

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
  // Don't allow booking in the past
  if (isDateInPast(date)) {
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
  // Check if date is in past
  if (isDateInPast(date)) {
    return false;
  }

  // Check if time is in past for today
  if (isToday(date) && isTimeInPast(time)) {
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

  // Get all overrides in range
  const overrides = await getDateOverrides(startDate, endDate);
  const overrideMap = new Map<string, DateOverride>();
  overrides.forEach((o) => overrideMap.set(o.date, o));

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
    // Skip past dates
    if (isDateInPast(date)) {
      availability.push({ date, is_open: false, slots: [] });
      continue;
    }

    const dayOfWeek = getDayOfWeek(date);
    const override = overrideMap.get(date);
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
