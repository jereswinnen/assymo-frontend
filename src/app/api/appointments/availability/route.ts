import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/appointments";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";

/**
 * GET /api/appointments/availability
 *
 * Get available appointment slots for a date range.
 *
 * Query parameters:
 * - startDate: Start date in YYYY-MM-DD format (defaults to today)
 * - endDate: End date in YYYY-MM-DD format (defaults to startDate + maxDaysAhead)
 *
 * Returns:
 * - dates: Array of DateAvailability objects with date, is_open, and slots
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse start date (default to today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateParam = searchParams.get("startDate");
    const startDate = startDateParam || today.toISOString().split("T")[0];

    // Parse end date (default to maxDaysAhead from config)
    const endDateParam = searchParams.get("endDate");
    let endDate: string;

    if (endDateParam) {
      endDate = endDateParam;
    } else {
      const end = new Date(startDate);
      end.setDate(end.getDate() + APPOINTMENTS_CONFIG.maxDaysAhead);
      endDate = end.toISOString().split("T")[0];
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: "Ongeldige startdatum" },
        { status: 400 }
      );
    }

    if (isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: "Ongeldige einddatum" },
        { status: 400 }
      );
    }

    if (endDateObj < startDateObj) {
      return NextResponse.json(
        { error: "Einddatum moet na startdatum liggen" },
        { status: 400 }
      );
    }

    // Limit range to prevent excessive queries
    const daysDiff = Math.ceil(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 90) {
      return NextResponse.json(
        { error: "Maximaal 90 dagen per aanvraag" },
        { status: 400 }
      );
    }

    // Get availability
    const availability = await getAvailability(startDate, endDate);

    return NextResponse.json({
      dates: availability,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van beschikbaarheid" },
      { status: 500 }
    );
  }
}
