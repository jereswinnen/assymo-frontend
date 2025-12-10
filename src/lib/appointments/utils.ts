import { randomBytes } from "crypto";

/**
 * Generate a secure random token for appointment edit/cancel links
 * Returns a 32-character hex string (128 bits of entropy)
 */
export function generateEditToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Format a date string for Dutch display
 * @param dateStr - Date string in "YYYY-MM-DD" format or Date object
 * @returns Formatted date like "dinsdag 15 januari 2025"
 */
export function formatDateNL(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;

  return date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a date string for short Dutch display
 * @param dateStr - Date string in "YYYY-MM-DD" format or Date object
 * @returns Formatted date like "15 jan 2025"
 */
export function formatDateShortNL(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;

  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a time string for Dutch display
 * @param timeStr - Time string in "HH:MM" or "HH:MM:SS" format
 * @returns Formatted time like "14:00 uur"
 */
export function formatTimeNL(timeStr: string): string {
  // Extract HH:MM from potentially longer format
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes} uur`;
}

/**
 * Format date and time together
 * @returns "dinsdag 15 januari 2025 om 14:00 uur"
 */
export function formatDateTimeNL(dateStr: string, timeStr: string): string {
  return `${formatDateNL(dateStr)} om ${formatTimeNL(timeStr)}`;
}

/**
 * Parse a time string to minutes since midnight
 * @param timeStr - Time string in "HH:MM" format
 * @returns Minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param minutes - Minutes since midnight
 * @returns Time string in "HH:MM" format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate time slots between open and close times
 * @param openTime - Opening time in "HH:MM" format
 * @param closeTime - Closing time in "HH:MM" format
 * @param slotDuration - Slot duration in minutes
 * @returns Array of time strings in "HH:MM" format
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(openTime);
  const endMinutes = timeToMinutes(closeTime);

  // Last slot should end at or before closing time
  for (
    let minutes = startMinutes;
    minutes + slotDuration <= endMinutes;
    minutes += slotDuration
  ) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

/**
 * Format a date to "YYYY-MM-DD" string
 */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Check if a date string is in the past
 */
export function isDateInPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date < today;
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
  const today = toDateString(new Date());
  return dateStr === today;
}

/**
 * Get current time in "HH:MM" format
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Check if a time slot is in the past for today
 * @param timeStr - Time string in "HH:MM" format
 * @returns true if the time has already passed today
 */
export function isTimeInPast(timeStr: string): boolean {
  const currentMinutes = timeToMinutes(getCurrentTime());
  const slotMinutes = timeToMinutes(timeStr);
  return slotMinutes <= currentMinutes;
}

/**
 * Get the day of week (0-6) from a date string
 * Uses Monday=0 through Sunday=6 convention (not JavaScript's Sunday=0)
 */
export function getDayOfWeek(dateStr: string): number {
  const jsDay = new Date(dateStr).getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Convert to Monday=0, Tuesday=1, ..., Sunday=6
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Generate a date range array
 * @param startDate - Start date
 * @param days - Number of days to include
 * @returns Array of date strings in "YYYY-MM-DD" format
 */
export function getDateRange(startDate: Date, days: number): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  for (let i = 0; i < days; i++) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Format customer address for display
 */
export function formatAddress(
  street: string,
  postalCode: string,
  city: string
): string {
  return `${street}, ${postalCode} ${city}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (permissive international validation)
 * Accepts any number with 8-15 digits, optionally starting with + for international format.
 * Examples: 0612345678, +31612345678, +32412345678, +49123456789, etc.
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces, dashes, parentheses, and dots
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Must have 8-15 digits, optionally starting with +
  // This covers most international formats (E.164 standard allows up to 15 digits)
  return /^\+?\d{8,15}$/.test(cleaned);
}

/**
 * Validate postal code
 * Accepts: 4 digits (Belgian) or 4 digits + 2 letters (Dutch)
 * Format: 1234 or 1234 AB or 1234AB
 */
export function isValidPostalCode(postalCode: string): boolean {
  const trimmed = postalCode.trim();
  // Belgian format: 4 digits
  // Dutch format: 4 digits + optional space + 2 letters
  return /^\d{4}(\s?[A-Za-z]{2})?$/.test(trimmed);
}

/**
 * Normalize postal code
 * If 6 chars (Dutch format), adds space: 1234AB -> 1234 AB
 * Otherwise returns trimmed input
 */
export function normalizePostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\s/g, "").toUpperCase();
  // Dutch format with letters
  if (cleaned.length === 6 && /^\d{4}[A-Z]{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return postalCode.trim();
}
