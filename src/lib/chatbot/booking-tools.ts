import { z } from "zod";
import { tool } from "ai";
import { getAvailability } from "@/lib/appointments/availability";
import { toDateString } from "@/lib/appointments/utils";

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
      const formattedAvailability = daysWithAvailability.map((day) => ({
        date: day.date,
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
 * All booking-related tools for the chatbot
 */
export const bookingTools = {
  checkAvailability: checkAvailabilityTool,
};
