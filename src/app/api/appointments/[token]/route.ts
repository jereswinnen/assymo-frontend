import { NextRequest, NextResponse } from "next/server";
import {
  getAppointmentByToken,
  updateAppointment,
  cancelAppointment,
  isSlotAvailable,
  sendCancellationEmail,
  sendUpdateEmail,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  normalizePostalCode,
} from "@/lib/appointments";
import type { PublicAppointmentView } from "@/types/appointments";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/appointments/[token]
 *
 * Get appointment details by edit token (for customer self-service).
 *
 * Returns public appointment view (excludes admin_notes and ip_address).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: "Ongeldige token" },
        { status: 400 }
      );
    }

    const appointment = await getAppointmentByToken(token);

    if (!appointment) {
      return NextResponse.json(
        { error: "Afspraak niet gevonden" },
        { status: 404 }
      );
    }

    // Return public view (exclude sensitive fields)
    const publicView: PublicAppointmentView = {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      customer_name: appointment.customer_name,
      customer_email: appointment.customer_email,
      customer_phone: appointment.customer_phone,
      customer_street: appointment.customer_street,
      customer_postal_code: appointment.customer_postal_code,
      customer_city: appointment.customer_city,
      remarks: appointment.remarks,
      status: appointment.status,
      created_at: appointment.created_at,
    };

    return NextResponse.json(publicView);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/appointments/[token]
 *
 * Update appointment details (customer self-service).
 *
 * Allowed updates:
 * - appointment_date and appointment_time (reschedule)
 * - customer details (name, email, phone, address)
 * - remarks
 *
 * Cannot update cancelled appointments.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: "Ongeldige token" },
        { status: 400 }
      );
    }

    const appointment = await getAppointmentByToken(token);

    if (!appointment) {
      return NextResponse.json(
        { error: "Afspraak niet gevonden" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Geannuleerde afspraken kunnen niet worden gewijzigd" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Track if date/time changed for email notification
    const previousDate = appointment.appointment_date;
    const previousTime = appointment.appointment_time;
    let dateTimeChanged = false;

    // Validate and prepare update data
    const updateData: Record<string, string> = {};

    // Handle date/time change (reschedule)
    if (body.appointment_date || body.appointment_time) {
      const newDate = body.appointment_date || appointment.appointment_date;
      const newTime = body.appointment_time || appointment.appointment_time;

      // Validate date format
      if (body.appointment_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.appointment_date)) {
        return NextResponse.json(
          { error: "Ongeldige datum (formaat: YYYY-MM-DD)" },
          { status: 400 }
        );
      }

      // Validate time format
      if (body.appointment_time && !/^\d{2}:\d{2}$/.test(body.appointment_time)) {
        return NextResponse.json(
          { error: "Ongeldige tijd (formaat: HH:MM)" },
          { status: 400 }
        );
      }

      // Check if actually changing
      if (newDate !== previousDate || newTime !== previousTime) {
        // Check if new slot is available
        const available = await isSlotAvailable(newDate, newTime);

        if (!available) {
          return NextResponse.json(
            {
              error: "Dit tijdslot is helaas niet meer beschikbaar. Kies een ander tijdstip.",
              code: "SLOT_UNAVAILABLE",
            },
            { status: 409 }
          );
        }

        updateData.appointment_date = newDate;
        updateData.appointment_time = newTime;
        dateTimeChanged = true;
      }
    }

    // Handle customer details updates
    if (body.customer_name !== undefined) {
      if (!body.customer_name.trim()) {
        return NextResponse.json(
          { error: "Naam is verplicht" },
          { status: 400 }
        );
      }
      updateData.customer_name = body.customer_name.trim();
    }

    if (body.customer_email !== undefined) {
      if (!isValidEmail(body.customer_email)) {
        return NextResponse.json(
          { error: "Ongeldig e-mailadres" },
          { status: 400 }
        );
      }
      updateData.customer_email = body.customer_email.trim().toLowerCase();
    }

    if (body.customer_phone !== undefined) {
      if (!isValidPhone(body.customer_phone)) {
        return NextResponse.json(
          { error: "Ongeldig telefoonnummer" },
          { status: 400 }
        );
      }
      updateData.customer_phone = body.customer_phone.trim();
    }

    if (body.customer_street !== undefined) {
      if (!body.customer_street.trim()) {
        return NextResponse.json(
          { error: "Straat en huisnummer is verplicht" },
          { status: 400 }
        );
      }
      updateData.customer_street = body.customer_street.trim();
    }

    if (body.customer_postal_code !== undefined) {
      if (!isValidPostalCode(body.customer_postal_code)) {
        return NextResponse.json(
          { error: "Ongeldige postcode (formaat: 1234 AB)" },
          { status: 400 }
        );
      }
      updateData.customer_postal_code = normalizePostalCode(body.customer_postal_code);
    }

    if (body.customer_city !== undefined) {
      if (!body.customer_city.trim()) {
        return NextResponse.json(
          { error: "Plaats is verplicht" },
          { status: 400 }
        );
      }
      updateData.customer_city = body.customer_city.trim();
    }

    if (body.remarks !== undefined) {
      updateData.remarks = body.remarks?.trim() || "";
    }

    // Check if there are any updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Geen wijzigingen opgegeven" },
        { status: 400 }
      );
    }

    // Update the appointment
    const updatedAppointment = await updateAppointment(appointment.id, updateData);

    if (!updatedAppointment) {
      return NextResponse.json(
        { error: "Kon afspraak niet bijwerken" },
        { status: 500 }
      );
    }

    // Send update email if date/time changed
    if (dateTimeChanged) {
      sendUpdateEmail(updatedAppointment, previousDate, previousTime).catch((err) => {
        console.error("Failed to send update email:", err);
      });
    }

    // Return updated public view
    const publicView: PublicAppointmentView = {
      id: updatedAppointment.id,
      appointment_date: updatedAppointment.appointment_date,
      appointment_time: updatedAppointment.appointment_time,
      duration_minutes: updatedAppointment.duration_minutes,
      customer_name: updatedAppointment.customer_name,
      customer_email: updatedAppointment.customer_email,
      customer_phone: updatedAppointment.customer_phone,
      customer_street: updatedAppointment.customer_street,
      customer_postal_code: updatedAppointment.customer_postal_code,
      customer_city: updatedAppointment.customer_city,
      remarks: updatedAppointment.remarks,
      status: updatedAppointment.status,
      created_at: updatedAppointment.created_at,
    };

    return NextResponse.json({
      success: true,
      appointment: publicView,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);

    // Handle unique constraint violation (double booking on reschedule)
    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return NextResponse.json(
        {
          error: "Dit tijdslot is helaas niet meer beschikbaar. Kies een ander tijdstip.",
          code: "SLOT_UNAVAILABLE",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de afspraak" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[token]
 *
 * Cancel an appointment (customer self-service).
 *
 * This performs a soft delete (sets status to 'cancelled').
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: "Ongeldige token" },
        { status: 400 }
      );
    }

    const appointment = await getAppointmentByToken(token);

    if (!appointment) {
      return NextResponse.json(
        { error: "Afspraak niet gevonden" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Deze afspraak is al geannuleerd" },
        { status: 400 }
      );
    }

    // Cancel the appointment
    const cancelledAppointment = await cancelAppointment(appointment.id);

    if (!cancelledAppointment) {
      return NextResponse.json(
        { error: "Kon afspraak niet annuleren" },
        { status: 500 }
      );
    }

    // Send cancellation email
    sendCancellationEmail(cancelledAppointment).catch((err) => {
      console.error("Failed to send cancellation email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Uw afspraak is geannuleerd",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het annuleren van de afspraak" },
      { status: 500 }
    );
  }
}
