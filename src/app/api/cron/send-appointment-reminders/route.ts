import { NextRequest } from "next/server";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";
import {
  getAppointmentsNeedingReminder,
  markReminderSent,
} from "@/lib/appointments/queries";
import { sendReminderEmail } from "@/lib/appointments/email";

/**
 * Cron job endpoint to send appointment reminder emails
 *
 * Runs daily (recommended: around 10:00 AM) via Vercel Cron
 * Sends reminder emails for appointments scheduled for tomorrow
 *
 * Only sends reminders if:
 * - Appointment is confirmed
 * - Appointment is tomorrow
 * - Reminder hasn't been sent yet
 * - Appointment was booked far enough in advance (not last-minute)
 */
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { hoursBeforeAppointment, minHoursAfterBookingForReminder } =
      APPOINTMENTS_CONFIG.reminders;

    // Get appointments that need reminders
    const appointments = await getAppointmentsNeedingReminder(
      hoursBeforeAppointment,
      minHoursAfterBookingForReminder
    );

    if (appointments.length === 0) {
      console.log("✅ No appointment reminders to send");
      return Response.json({
        success: true,
        reminders_sent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Send reminders and track results
    const results = await Promise.all(
      appointments.map(async (appointment) => {
        const emailResult = await sendReminderEmail(appointment);

        if (emailResult.success) {
          // Mark reminder as sent in database
          await markReminderSent(appointment.id);
          console.log(
            `✅ Reminder sent for appointment ${appointment.id} (${appointment.customer_email})`
          );
          return { id: appointment.id, success: true };
        } else {
          console.error(
            `❌ Failed to send reminder for appointment ${appointment.id}:`,
            emailResult.error
          );
          return { id: appointment.id, success: false, error: emailResult.error };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    console.log(
      `✅ Reminder job complete: ${successCount} sent, ${failedCount} failed`
    );

    return Response.json({
      success: true,
      reminders_sent: successCount,
      reminders_failed: failedCount,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Reminder cron error:", error);
    return Response.json(
      { success: false, error: "Reminder job failed" },
      { status: 500 }
    );
  }
}
