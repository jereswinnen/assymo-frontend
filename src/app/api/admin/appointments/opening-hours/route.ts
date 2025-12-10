import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAppointmentSettings, updateSettings } from "@/lib/appointments";
import type { UpdateSettingsInput } from "@/types/appointments";

/**
 * GET /api/admin/appointments/settings
 *
 * Get weekly schedule settings (opening hours for each day).
 */
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAppointmentSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/appointments/settings
 *
 * Update settings for a specific day of the week.
 *
 * Request body:
 * - day_of_week: 0-6 (Sunday-Saturday)
 * - is_open: boolean
 * - open_time: "HH:MM" or null
 * - close_time: "HH:MM" or null
 * - slot_duration_minutes: number (default 60)
 */
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate day_of_week
    if (body.day_of_week === undefined || body.day_of_week < 0 || body.day_of_week > 6) {
      return NextResponse.json(
        { error: "Ongeldige dag (0-6 verwacht)" },
        { status: 400 }
      );
    }

    // Validate is_open
    if (typeof body.is_open !== "boolean") {
      return NextResponse.json(
        { error: "is_open moet een boolean zijn" },
        { status: 400 }
      );
    }

    // If open, validate times
    if (body.is_open) {
      if (!body.open_time || !body.close_time) {
        return NextResponse.json(
          { error: "Open- en sluitingstijd zijn verplicht voor open dagen" },
          { status: 400 }
        );
      }

      // Validate time format
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(body.open_time) || !timeRegex.test(body.close_time)) {
        return NextResponse.json(
          { error: "Ongeldige tijdnotatie (HH:MM verwacht)" },
          { status: 400 }
        );
      }

      // Validate close time is after open time
      const openMinutes = timeToMinutes(body.open_time);
      const closeMinutes = timeToMinutes(body.close_time);

      if (closeMinutes <= openMinutes) {
        return NextResponse.json(
          { error: "Sluitingstijd moet na openingstijd liggen" },
          { status: 400 }
        );
      }
    }

    // Validate slot duration if provided
    if (body.slot_duration_minutes !== undefined) {
      const duration = body.slot_duration_minutes;
      if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
        return NextResponse.json(
          { error: "Ongeldige slot duur (15-480 minuten)" },
          { status: 400 }
        );
      }
    }

    const input: UpdateSettingsInput = {
      day_of_week: body.day_of_week,
      is_open: body.is_open,
      open_time: body.is_open ? body.open_time : null,
      close_time: body.is_open ? body.close_time : null,
      slot_duration_minutes: body.slot_duration_minutes || 60,
    };

    const updated = await updateSettings(input);

    return NextResponse.json({
      success: true,
      setting: updated,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/appointments/settings
 *
 * Bulk update multiple days at once.
 *
 * Request body:
 * - settings: Array of UpdateSettingsInput objects
 */
export async function PATCH(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!Array.isArray(body.settings)) {
      return NextResponse.json(
        { error: "settings moet een array zijn" },
        { status: 400 }
      );
    }

    const results = [];

    for (const setting of body.settings) {
      // Validate each setting
      if (setting.day_of_week === undefined || setting.day_of_week < 0 || setting.day_of_week > 6) {
        return NextResponse.json(
          { error: `Ongeldige dag: ${setting.day_of_week}` },
          { status: 400 }
        );
      }

      if (typeof setting.is_open !== "boolean") {
        return NextResponse.json(
          { error: `is_open moet een boolean zijn voor dag ${setting.day_of_week}` },
          { status: 400 }
        );
      }

      const input: UpdateSettingsInput = {
        day_of_week: setting.day_of_week,
        is_open: setting.is_open,
        open_time: setting.is_open ? setting.open_time : null,
        close_time: setting.is_open ? setting.close_time : null,
        slot_duration_minutes: setting.slot_duration_minutes || 60,
      };

      const updated = await updateSettings(input);
      results.push(updated);
    }

    return NextResponse.json({
      success: true,
      settings: results,
    });
  } catch (error) {
    console.error("Error bulk updating settings:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
