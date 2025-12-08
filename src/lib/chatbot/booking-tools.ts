import { z } from "zod";
import { tool } from "ai";
import {
  getAvailability,
  isSlotAvailable,
} from "@/lib/appointments/availability";
import { createAppointment } from "@/lib/appointments/queries";
import { sendNewAppointmentEmails } from "@/lib/appointments/email";
import {
  toDateString,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  normalizePostalCode,
  formatDateNL,
  formatTimeNL,
} from "@/lib/appointments/utils";

/**
 * Tool for checking appointment availability
 *
 * Allows the chatbot to query available appointment slots for a date range.
 * Returns structured availability data that the AI can format conversationally.
 */
export const checkAvailabilityTool = tool({
  description:
    "Check available appointment slots for visiting the Assymo showroom. Use this when a customer asks about availability, when they can visit, or wants to book an appointment.",
  inputSchema: z.object({
    start_date: z
      .string()
      .optional()
      .describe(
        "Start date in YYYY-MM-DD format. Defaults to today if not provided."
      ),
    end_date: z
      .string()
      .optional()
      .describe(
        "End date in YYYY-MM-DD format. Defaults to 7 days from start_date if not provided."
      ),
  }),
  execute: async ({
    start_date,
    end_date,
  }: {
    start_date?: string;
    end_date?: string;
  }) => {
    // Default to today if no start date provided
    const startDate = start_date || toDateString(new Date());

    // Default to 7 days from start if no end date provided
    const endDate =
      end_date ||
      toDateString(
        new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000)
      );

    try {
      const availability = await getAvailability(startDate, endDate);

      // Filter to only include days that have available slots
      const daysWithAvailability = availability.filter(
        (day) => day.is_open && day.slots.some((slot) => slot.available)
      );

      // Format for the AI to present conversationally
      // Pre-format dates so the AI doesn't need to calculate day names
      const formattedAvailability = daysWithAvailability.map((day) => ({
        date: day.date,
        date_formatted: formatDateNL(day.date), // e.g., "maandag 9 december 2024"
        available_times: day.slots
          .filter((slot) => slot.available)
          .map((slot) => slot.time),
      }));

      return {
        success: true,
        start_date: startDate,
        end_date: endDate,
        available_days: formattedAvailability,
        total_available_slots: formattedAvailability.reduce(
          (sum, day) => sum + day.available_times.length,
          0
        ),
      };
    } catch (error) {
      console.error("Error checking availability:", error);
      return {
        success: false,
        error: "Er is een fout opgetreden bij het ophalen van de beschikbaarheid.",
      };
    }
  },
});

/**
 * Schema for booking information validation
 */
const bookingInfoSchema = z.object({
  customer_name: z.string().optional().describe("Customer's full name"),
  customer_email: z
    .string()
    .optional()
    .describe("Customer's email address"),
  customer_phone: z
    .string()
    .optional()
    .describe("Customer's phone number"),
  customer_street: z
    .string()
    .optional()
    .describe("Street name and house number"),
  customer_postal_code: z
    .string()
    .optional()
    .describe("Postal code (Dutch: 1234 AB, Belgian: 1234)"),
  customer_city: z.string().optional().describe("City name"),
  appointment_date: z
    .string()
    .optional()
    .describe("Selected appointment date in YYYY-MM-DD format"),
  appointment_time: z
    .string()
    .optional()
    .describe("Selected appointment time in HH:MM format"),
  remarks: z.string().optional().describe("Any additional remarks from the customer"),
});

type BookingInfo = z.infer<typeof bookingInfoSchema>;

/**
 * Tool for validating and structuring booking information
 *
 * This tool helps the AI:
 * 1. Validate customer information as it's collected
 * 2. Track which required fields are still missing
 * 3. Normalize data (e.g., postal codes)
 *
 * The AI should use this tool after collecting information to verify it's valid
 * before proceeding to the booking confirmation step.
 */
export const collectBookingInfoTool = tool({
  description:
    "Validate and structure booking information collected from the customer. Use this to check if the collected data is valid and to see which required fields are still missing. Call this after the customer provides their details.",
  inputSchema: bookingInfoSchema,
  execute: async (info: BookingInfo) => {
    const validationResults: Record<string, { valid: boolean; error?: string; normalized?: string }> = {};
    const missingFields: string[] = [];

    // Required fields check
    const requiredFields = [
      { key: "customer_name", label: "naam" },
      { key: "customer_email", label: "e-mailadres" },
      { key: "customer_phone", label: "telefoonnummer" },
      { key: "customer_street", label: "straat en huisnummer" },
      { key: "customer_postal_code", label: "postcode" },
      { key: "customer_city", label: "plaats" },
      { key: "appointment_date", label: "afspraakdatum" },
      { key: "appointment_time", label: "afspraaktijd" },
    ] as const;

    for (const field of requiredFields) {
      const value = info[field.key as keyof BookingInfo];
      if (!value || value.trim() === "") {
        missingFields.push(field.label);
      }
    }

    // Validate email if provided
    if (info.customer_email) {
      const emailValid = isValidEmail(info.customer_email);
      validationResults.email = emailValid
        ? { valid: true }
        : { valid: false, error: "Ongeldig e-mailadres formaat" };
    }

    // Validate phone if provided
    if (info.customer_phone) {
      const phoneValid = isValidPhone(info.customer_phone);
      validationResults.phone = phoneValid
        ? { valid: true }
        : { valid: false, error: "Ongeldig telefoonnummer. Gebruik een Nederlands of Belgisch nummer." };
    }

    // Validate and normalize postal code if provided
    if (info.customer_postal_code) {
      const postalValid = isValidPostalCode(info.customer_postal_code);
      if (postalValid) {
        const normalized = normalizePostalCode(info.customer_postal_code);
        validationResults.postal_code = { valid: true, normalized };
      } else {
        validationResults.postal_code = {
          valid: false,
          error: "Ongeldige postcode. Gebruik Nederlands (1234 AB) of Belgisch (1234) formaat.",
        };
      }
    }

    // Validate date format if provided
    if (info.appointment_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateValid = dateRegex.test(info.appointment_date);
      validationResults.date = dateValid
        ? { valid: true }
        : { valid: false, error: "Ongeldige datum. Gebruik YYYY-MM-DD formaat." };
    }

    // Validate time format if provided
    if (info.appointment_time) {
      const timeRegex = /^\d{2}:\d{2}$/;
      const timeValid = timeRegex.test(info.appointment_time);
      validationResults.time = timeValid
        ? { valid: true }
        : { valid: false, error: "Ongeldige tijd. Gebruik HH:MM formaat." };
    }

    // Check if all validations passed
    const allValid = Object.values(validationResults).every((r) => r.valid);
    const isComplete = missingFields.length === 0 && allValid;

    // Build normalized data if all is valid
    const normalizedData = isComplete
      ? {
          customer_name: info.customer_name!.trim(),
          customer_email: info.customer_email!.trim().toLowerCase(),
          customer_phone: info.customer_phone!.trim(),
          customer_street: info.customer_street!.trim(),
          customer_postal_code: validationResults.postal_code?.normalized || info.customer_postal_code!.trim(),
          customer_city: info.customer_city!.trim(),
          appointment_date: info.appointment_date!,
          appointment_time: info.appointment_time!,
          remarks: info.remarks?.trim() || null,
        }
      : null;

    return {
      is_complete: isComplete,
      missing_fields: missingFields,
      validation_results: validationResults,
      normalized_data: normalizedData,
    };
  },
});

/**
 * Schema for creating an appointment
 */
const createAppointmentSchema = z.object({
  appointment_date: z.string().describe("Appointment date in YYYY-MM-DD format"),
  appointment_time: z.string().describe("Appointment time in HH:MM format"),
  customer_name: z.string().describe("Customer's full name"),
  customer_email: z.string().describe("Customer's email address"),
  customer_phone: z.string().describe("Customer's phone number"),
  customer_street: z.string().describe("Street name and house number"),
  customer_postal_code: z.string().describe("Postal code"),
  customer_city: z.string().describe("City name"),
  remarks: z.string().optional().describe("Optional remarks from the customer"),
});

type CreateAppointmentParams = z.infer<typeof createAppointmentSchema>;

/**
 * Tool for creating an appointment
 *
 * IMPORTANT: Only use this tool AFTER the customer has confirmed all details.
 * The AI should summarize the booking details and ask for explicit confirmation
 * before calling this tool.
 */
export const createAppointmentTool = tool({
  description:
    "Create a new appointment booking. ONLY use this after the customer has explicitly confirmed all their details are correct. This will create the appointment and send confirmation emails.",
  inputSchema: createAppointmentSchema,
  execute: async (params: CreateAppointmentParams) => {
    // Validate all required fields
    const errors: string[] = [];

    if (!params.customer_name?.trim()) {
      errors.push("Naam ontbreekt");
    }

    if (!isValidEmail(params.customer_email)) {
      errors.push("Ongeldig e-mailadres");
    }

    if (!isValidPhone(params.customer_phone)) {
      errors.push("Ongeldig telefoonnummer");
    }

    if (!isValidPostalCode(params.customer_postal_code)) {
      errors.push("Ongeldige postcode");
    }

    if (!params.customer_street?.trim()) {
      errors.push("Straat ontbreekt");
    }

    if (!params.customer_city?.trim()) {
      errors.push("Plaats ontbreekt");
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.appointment_date)) {
      errors.push("Ongeldige datum");
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(params.appointment_time)) {
      errors.push("Ongeldige tijd");
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: "validation_error",
        message: `Validatiefouten: ${errors.join(", ")}`,
        errors,
      };
    }

    // Check if slot is still available (race condition prevention)
    try {
      const slotAvailable = await isSlotAvailable(
        params.appointment_date,
        params.appointment_time
      );

      if (!slotAvailable) {
        return {
          success: false,
          error: "slot_unavailable",
          message:
            "Helaas, dit tijdslot is niet meer beschikbaar. Wil je een ander moment kiezen?",
        };
      }
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return {
        success: false,
        error: "system_error",
        message:
          "Er ging iets mis bij het controleren van de beschikbaarheid. Probeer het opnieuw.",
      };
    }

    // Create the appointment
    try {
      const normalizedPostalCode = normalizePostalCode(params.customer_postal_code);

      const appointment = await createAppointment({
        appointment_date: params.appointment_date,
        appointment_time: params.appointment_time,
        customer_name: params.customer_name.trim(),
        customer_email: params.customer_email.trim().toLowerCase(),
        customer_phone: params.customer_phone.trim(),
        customer_street: params.customer_street.trim(),
        customer_postal_code: normalizedPostalCode,
        customer_city: params.customer_city.trim(),
        remarks: params.remarks?.trim() || undefined,
      });

      // Send confirmation emails (customer + admin)
      const emailResults = await sendNewAppointmentEmails(appointment);

      if (!emailResults.customerEmail) {
        console.error("Failed to send customer confirmation email");
      }

      if (!emailResults.adminEmail) {
        console.error("Failed to send admin notification email");
      }

      // Generate edit URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://assymo.be";
      const editUrl = `${baseUrl}/afspraak/${appointment.edit_token}`;

      return {
        success: true,
        appointment: {
          id: appointment.id,
          date: formatDateNL(appointment.appointment_date),
          time: formatTimeNL(appointment.appointment_time),
          customer_name: appointment.customer_name,
          customer_email: appointment.customer_email,
        },
        edit_url: editUrl,
        emails_sent: {
          customer: emailResults.customerEmail,
          admin: emailResults.adminEmail,
        },
        message: `Afspraak bevestigd voor ${formatDateNL(appointment.appointment_date)} om ${formatTimeNL(appointment.appointment_time)}`,
      };
    } catch (error) {
      console.error("Error creating appointment:", error);
      return {
        success: false,
        error: "system_error",
        message:
          "Er ging iets mis bij het aanmaken van de afspraak. Je kunt ook direct boeken via onze website: assymo.be/afspraak",
      };
    }
  },
});

/**
 * All booking-related tools for the chatbot
 */
export const bookingTools = {
  checkAvailability: checkAvailabilityTool,
  collectBookingInfo: collectBookingInfoTool,
  createAppointment: createAppointmentTool,
};
