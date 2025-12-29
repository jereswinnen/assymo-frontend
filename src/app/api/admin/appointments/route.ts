import { NextRequest, NextResponse } from "next/server";
import { protectRoute } from "@/lib/permissions";
import {
  getAllAppointments,
  getAppointmentsByDateRange,
  searchAppointments,
  createAppointment,
  sendNewAppointmentEmails,
  isSlotBooked,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  normalizePostalCode,
} from "@/lib/appointments";
import type { CreateAppointmentInput, AppointmentStatus } from "@/types/appointments";

/**
 * GET /api/admin/appointments
 *
 * List appointments with optional filters.
 *
 * Query parameters:
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - status: Filter by status (confirmed, cancelled, completed, all)
 * - search: Search by customer name, email, or phone
 * - limit: Max results (default 100)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "appointments" });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") as AppointmentStatus | "all" | null;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let appointments;

    // Search takes precedence
    if (search && search.trim()) {
      appointments = await searchAppointments(search.trim(), limit);
    }
    // Date range filter
    else if (startDate && endDate) {
      appointments = await getAppointmentsByDateRange(
        startDate,
        endDate,
        status || "all"
      );
    }
    // Default: get all with pagination
    else {
      appointments = await getAllAppointments(limit, offset);
    }

    return NextResponse.json({
      appointments,
      count: appointments.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/appointments
 *
 * Create a new appointment (admin manual entry).
 *
 * Request body same as public booking, plus:
 * - admin_notes: Optional internal notes
 * - send_confirmation: Whether to send confirmation email (default true)
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "appointments" });
    if (!authorized) return response;

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "appointment_date",
      "appointment_time",
      "customer_name",
      "customer_email",
      "customer_phone",
      "customer_street",
      "customer_postal_code",
      "customer_city",
    ];

    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === "string" && !body[field].trim())) {
        return NextResponse.json(
          { error: `Veld '${field}' is verplicht` },
          { status: 400 }
        );
      }
    }

    // Validate formats
    if (!isValidEmail(body.customer_email)) {
      return NextResponse.json(
        { error: "Ongeldig e-mailadres" },
        { status: 400 }
      );
    }

    if (!isValidPhone(body.customer_phone)) {
      return NextResponse.json(
        { error: "Ongeldig telefoonnummer" },
        { status: 400 }
      );
    }

    if (!isValidPostalCode(body.customer_postal_code)) {
      return NextResponse.json(
        { error: "Ongeldige postcode" },
        { status: 400 }
      );
    }

    // Admin can book any day/time, only check for double-booking
    const alreadyBooked = await isSlotBooked(
      body.appointment_date,
      body.appointment_time
    );

    if (alreadyBooked) {
      return NextResponse.json(
        { error: "Dit tijdslot is al geboekt" },
        { status: 409 }
      );
    }

    // Create appointment
    const input: CreateAppointmentInput = {
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email.trim().toLowerCase(),
      customer_phone: body.customer_phone.trim(),
      customer_street: body.customer_street.trim(),
      customer_postal_code: normalizePostalCode(body.customer_postal_code),
      customer_city: body.customer_city.trim(),
      remarks: body.remarks?.trim() || undefined,
    };

    const appointment = await createAppointment(input);

    // Update admin notes if provided
    if (body.admin_notes) {
      const { updateAppointment } = await import("@/lib/appointments");
      await updateAppointment(appointment.id, { admin_notes: body.admin_notes });
    }

    // Send confirmation emails (unless explicitly disabled)
    const sendConfirmation = body.send_confirmation !== false;
    if (sendConfirmation) {
      sendNewAppointmentEmails(appointment).catch((err) => {
        console.error("Failed to send appointment emails:", err);
      });
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);

    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "Dit tijdslot is niet beschikbaar" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
