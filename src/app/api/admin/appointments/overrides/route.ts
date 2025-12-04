import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getAllDateOverrides,
  getDateOverrides,
  createDateOverride,
  deleteDateOverride,
} from "@/lib/appointments";
import type { CreateDateOverrideInput } from "@/types/appointments";

/**
 * GET /api/admin/appointments/overrides
 *
 * Get date-specific overrides (holidays, closures, special hours).
 *
 * Query parameters:
 * - startDate: Filter by start date (optional)
 * - endDate: Filter by end date (optional)
 *
 * Without filters, returns all overrides sorted by date desc.
 */
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let overrides;

    if (startDate && endDate) {
      overrides = await getDateOverrides(startDate, endDate);
    } else {
      overrides = await getAllDateOverrides();
    }

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error("Error fetching overrides:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/appointments/overrides
 *
 * Create a new date override (close a day, special hours, etc.).
 *
 * Request body:
 * - date: Date in YYYY-MM-DD format (required)
 * - is_closed: Boolean (default true)
 * - open_time: "HH:MM" (optional, for special hours)
 * - close_time: "HH:MM" (optional, for special hours)
 * - reason: String (optional, e.g., "Feestdag", "Vakantie")
 */
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate date
    if (!body.date) {
      return NextResponse.json(
        { error: "Datum is verplicht" },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        { error: "Ongeldige datum (YYYY-MM-DD verwacht)" },
        { status: 400 }
      );
    }

    // Validate that date is not in the past
    const overrideDate = new Date(body.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (overrideDate < today) {
      return NextResponse.json(
        { error: "Kan geen override maken voor datum in het verleden" },
        { status: 400 }
      );
    }

    // Default is_closed to true
    const isClosed = body.is_closed !== false;

    // If not closed, validate special hours
    if (!isClosed) {
      if (!body.open_time || !body.close_time) {
        return NextResponse.json(
          { error: "Open- en sluitingstijd zijn verplicht voor aangepaste uren" },
          { status: 400 }
        );
      }

      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(body.open_time) || !timeRegex.test(body.close_time)) {
        return NextResponse.json(
          { error: "Ongeldige tijdnotatie (HH:MM verwacht)" },
          { status: 400 }
        );
      }
    }

    const input: CreateDateOverrideInput = {
      date: body.date,
      is_closed: isClosed,
      open_time: isClosed ? null : body.open_time,
      close_time: isClosed ? null : body.close_time,
      reason: body.reason?.trim() || undefined,
    };

    const override = await createDateOverride(input);

    return NextResponse.json({
      success: true,
      override,
    });
  } catch (error) {
    console.error("Error creating override:", error);

    // Handle unique constraint (date already has override)
    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "Er bestaat al een override voor deze datum" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/appointments/overrides
 *
 * Delete a date override.
 *
 * Query parameters:
 * - id: Override ID to delete (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is verplicht" },
        { status: 400 }
      );
    }

    const overrideId = parseInt(id, 10);

    if (isNaN(overrideId)) {
      return NextResponse.json(
        { error: "Ongeldig ID" },
        { status: 400 }
      );
    }

    const deleted = await deleteDateOverride(overrideId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Override niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Override verwijderd",
    });
  } catch (error) {
    console.error("Error deleting override:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
