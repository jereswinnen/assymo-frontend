import { NextRequest, NextResponse } from "next/server";
import { getAppointmentsByDateRange } from "@/lib/appointments/queries";
import { generateCalendarFeed } from "@/lib/appointments/ics";

/**
 * GET /api/calendar/appointments
 *
 * Returns an ICS calendar feed of appointments for subscription.
 *
 * Query parameters:
 * - token: Required secret token for authentication
 *
 * This endpoint is designed for calendar subscription (Apple Calendar,
 * Google Calendar, Outlook, etc.). The feed includes all confirmed
 * appointments from the past 30 days to 1 year in the future.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Validate token
  const expectedToken = process.env.CALENDAR_TOKEN;

  if (!expectedToken) {
    console.error("CALENDAR_TOKEN environment variable is not set");
    return new NextResponse("Calendar feed not configured", { status: 503 });
  }

  if (!token || token !== expectedToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Calculate date range: 30 days ago to 1 year ahead
    const today = new Date();

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Fetch confirmed appointments
    const appointments = await getAppointmentsByDateRange(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      "confirmed"
    );

    // Generate ICS feed
    const icsContent = generateCalendarFeed(appointments);

    // Return with appropriate headers for calendar subscription
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="assymo-afspraken.ics"',
        // Allow caching for 5 minutes to reduce server load
        // Calendar apps typically refresh every 15 min to 24 hours anyway
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error generating calendar feed:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
