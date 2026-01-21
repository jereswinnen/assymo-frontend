import type { Appointment } from "@/types/appointments";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";

/**
 * Format a date and time for ICS format (YYYYMMDDTHHMMSS)
 */
function formatICSDateTime(dateStr: string, timeStr: string): string {
  const date = dateStr.replace(/-/g, "");
  const time = timeStr.replace(/:/g, "").substring(0, 4) + "00";
  return `${date}T${time}`;
}

/**
 * Calculate end time by adding duration to start time
 */
function calculateEndTime(timeStr: string, durationMinutes: number): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMins = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate a unique identifier for the calendar event
 */
function generateUID(appointment: Appointment): string {
  return `appointment-${appointment.id}@assymo.be`;
}

/**
 * Generate ICS file content for an appointment
 *
 * @param appointment - The appointment to generate ICS for
 * @returns ICS file content as string
 */
export function generateICS(appointment: Appointment): string {
  const startDateTime = formatICSDateTime(
    appointment.appointment_date,
    appointment.appointment_time,
  );

  const endTime = calculateEndTime(
    appointment.appointment_time,
    appointment.duration_minutes,
  );
  const endDateTime = formatICSDateTime(appointment.appointment_date, endTime);

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const summary = `Afspraak: ${escapeICS(appointment.customer_name)}`;

  const description = [
    `Klant: ${appointment.customer_name}`,
    `E-mail: ${appointment.customer_email}`,
    `Telefoon: ${appointment.customer_phone}`,
    `Adres: ${appointment.customer_street}, ${appointment.customer_postal_code} ${appointment.customer_city}`,
    appointment.remarks ? `Opmerkingen: ${appointment.remarks}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  // Build ICS content according to RFC 5545
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Assymo//Appointment System//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${generateUID(appointment)}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(APPOINTMENTS_CONFIG.storeLocation)}`,
    `ORGANIZER;CN=Assymo:mailto:info@assymo.be`,
    `ATTENDEE;CN=${escapeICS(appointment.customer_name)};RSVP=TRUE:mailto:${appointment.customer_email}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return icsLines.join("\r\n");
}

/**
 * Generate ICS for a cancelled appointment
 */
export function generateCancellationICS(appointment: Appointment): string {
  const startDateTime = formatICSDateTime(
    appointment.appointment_date,
    appointment.appointment_time,
  );

  const endTime = calculateEndTime(
    appointment.appointment_time,
    appointment.duration_minutes,
  );
  const endDateTime = formatICSDateTime(appointment.appointment_date, endTime);

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const summary = `GEANNULEERD: Afspraak ${escapeICS(appointment.customer_name)}`;

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Assymo//Appointment System//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${generateUID(appointment)}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${summary}`,
    `LOCATION:${escapeICS(APPOINTMENTS_CONFIG.storeLocation)}`,
    "STATUS:CANCELLED",
    "SEQUENCE:1",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return icsLines.join("\r\n");
}

/**
 * Generate ICS filename for an appointment
 */
export function generateICSFilename(appointment: Appointment): string {
  const date = appointment.appointment_date.replace(/-/g, "");
  return `assymo-afspraak-${date}.ics`;
}

/**
 * Generate an ICS calendar feed with multiple appointments
 *
 * Unlike generateICS which creates a single event for email attachments,
 * this creates a subscribable calendar feed with all appointments.
 *
 * @param appointments - Array of appointments to include in the feed
 * @param calendarName - Name for the calendar (shown in calendar apps)
 * @returns ICS file content as string
 */
export function generateCalendarFeed(
  appointments: Appointment[],
  calendarName = "Assymo Afspraken"
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events = appointments.map((appointment) => {
    const startDateTime = formatICSDateTime(
      appointment.appointment_date,
      appointment.appointment_time
    );

    const endTime = calculateEndTime(
      appointment.appointment_time,
      appointment.duration_minutes
    );
    const endDateTime = formatICSDateTime(appointment.appointment_date, endTime);

    const summary = `Afspraak: ${escapeICS(appointment.customer_name)}`;

    const description = [
      `Klant: ${appointment.customer_name}`,
      `E-mail: ${appointment.customer_email}`,
      `Telefoon: ${appointment.customer_phone}`,
      `Adres: ${appointment.customer_street}, ${appointment.customer_postal_code} ${appointment.customer_city}`,
      appointment.remarks ? `Opmerkingen: ${appointment.remarks}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return [
      "BEGIN:VEVENT",
      `UID:${generateUID(appointment)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `LOCATION:${escapeICS(APPOINTMENTS_CONFIG.storeLocation)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].join("\r\n");
  });

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Assymo//Appointment System//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    `X-WR-TIMEZONE:Europe/Brussels`,
    ...events,
    "END:VCALENDAR",
  ];

  return icsLines.join("\r\n");
}
