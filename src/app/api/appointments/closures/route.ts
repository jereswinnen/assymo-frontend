import { NextResponse } from "next/server";
import { getPublicClosures } from "@/lib/appointments";
import type { PublicClosure } from "@/types/appointments";

/**
 * GET /api/appointments/closures
 *
 * Public API endpoint to get upcoming closures for website display.
 * Returns only overrides with show_on_website = true.
 *
 * No authentication required - this is a public endpoint.
 *
 * Response:
 * {
 *   closures: [
 *     {
 *       id: number,
 *       start_date: string,
 *       end_date: string | null,
 *       is_closed: boolean,
 *       reason: string | null,
 *       is_recurring: boolean
 *     }
 *   ]
 * }
 */
export async function GET() {
  try {
    const overrides = await getPublicClosures();

    // Transform to public format (rename date to start_date for clarity)
    const closures: PublicClosure[] = overrides.map((override) => ({
      id: override.id,
      start_date: override.date,
      end_date: override.end_date,
      is_closed: override.is_closed,
      reason: override.reason,
      is_recurring: override.is_recurring,
    }));

    return NextResponse.json(
      { closures },
      {
        headers: {
          // Cache for 5 minutes, allow stale for 1 hour while revalidating
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching public closures:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
