import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";
import {
  AppointmentConfirmation,
  AppointmentAdminNotification,
  AppointmentCancellation,
  AppointmentUpdated,
} from "@/emails";
import { generateICS, generateICSFilename } from "./ics";
import { formatDateNL, formatTimeNL } from "./utils";
import type { Appointment } from "@/types/appointments";

/**
 * Base URL for appointment management links
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://assymo.be";
}

/**
 * Generate the edit/manage URL for an appointment
 */
function getEditUrl(editToken: string): string {
  return `${getBaseUrl()}/afspraak/${editToken}`;
}

/**
 * Generate the booking URL for new appointments
 */
function getBookingUrl(): string {
  return `${getBaseUrl()}/afspraak`;
}

/**
 * Send confirmation email to customer after booking
 */
export async function sendConfirmationEmail(
  appointment: Appointment
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: RESEND_CONFIG.fromAddressAppointments,
      to: [appointment.customer_email],
      subject: RESEND_CONFIG.subjects.appointmentConfirmation,
      react: AppointmentConfirmation({
        customerName: appointment.customer_name,
        appointmentDate: formatDateNL(appointment.appointment_date),
        appointmentTime: formatTimeNL(appointment.appointment_time),
        storeLocation: APPOINTMENTS_CONFIG.storeLocation,
        editUrl: getEditUrl(appointment.edit_token),
      }),
    });

    if (error) {
      console.error("Failed to send confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending confirmation email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send notification email to admin with ICS attachment
 */
export async function sendAdminNotification(
  appointment: Appointment
): Promise<{ success: boolean; error?: string }> {
  try {
    const icsContent = generateICS(appointment);
    const icsFilename = generateICSFilename(appointment);

    const { error } = await resend.emails.send({
      from: RESEND_CONFIG.fromAddressAppointments,
      to: [RESEND_CONFIG.appointmentRecipient],
      subject: RESEND_CONFIG.subjects.appointmentAdmin,
      react: AppointmentAdminNotification({
        customerName: appointment.customer_name,
        customerEmail: appointment.customer_email,
        customerPhone: appointment.customer_phone,
        customerStreet: appointment.customer_street,
        customerPostalCode: appointment.customer_postal_code,
        customerCity: appointment.customer_city,
        appointmentDate: formatDateNL(appointment.appointment_date),
        appointmentTime: formatTimeNL(appointment.appointment_time),
        remarks: appointment.remarks,
      }),
      attachments: [
        {
          filename: icsFilename,
          content: Buffer.from(icsContent, "utf-8"),
          contentType: "text/calendar",
        },
      ],
    });

    if (error) {
      console.error("Failed to send admin notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending admin notification:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send cancellation email to customer
 */
export async function sendCancellationEmail(
  appointment: Appointment
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: RESEND_CONFIG.fromAddressAppointments,
      to: [appointment.customer_email],
      subject: RESEND_CONFIG.subjects.appointmentCancellation,
      react: AppointmentCancellation({
        customerName: appointment.customer_name,
        appointmentDate: formatDateNL(appointment.appointment_date),
        appointmentTime: formatTimeNL(appointment.appointment_time),
        bookingUrl: getBookingUrl(),
      }),
    });

    if (error) {
      console.error("Failed to send cancellation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending cancellation email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send update email to customer when appointment is modified
 */
export async function sendUpdateEmail(
  appointment: Appointment,
  previousDate?: string,
  previousTime?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: RESEND_CONFIG.fromAddressAppointments,
      to: [appointment.customer_email],
      subject: RESEND_CONFIG.subjects.appointmentUpdated,
      react: AppointmentUpdated({
        customerName: appointment.customer_name,
        appointmentDate: formatDateNL(appointment.appointment_date),
        appointmentTime: formatTimeNL(appointment.appointment_time),
        storeLocation: APPOINTMENTS_CONFIG.storeLocation,
        previousDate: previousDate ? formatDateNL(previousDate) : undefined,
        previousTime: previousTime ? formatTimeNL(previousTime) : undefined,
        editUrl: getEditUrl(appointment.edit_token),
      }),
    });

    if (error) {
      console.error("Failed to send update email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending update email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send all emails for a new appointment (customer confirmation + admin notification)
 */
export async function sendNewAppointmentEmails(
  appointment: Appointment
): Promise<{ customerEmail: boolean; adminEmail: boolean }> {
  const [customerResult, adminResult] = await Promise.all([
    sendConfirmationEmail(appointment),
    sendAdminNotification(appointment),
  ]);

  if (!customerResult.success) {
    console.error("Customer email failed:", customerResult.error);
  }

  if (!adminResult.success) {
    console.error("Admin email failed:", adminResult.error);
  }

  return {
    customerEmail: customerResult.success,
    adminEmail: adminResult.success,
  };
}
