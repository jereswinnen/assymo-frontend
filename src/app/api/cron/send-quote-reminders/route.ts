import { NextRequest } from "next/server";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG, DEFAULT_TEST_EMAIL } from "@/config/resend";
import { QUOTE_REMINDER_CONFIG } from "@/config/configurator";
import {
  getQuoteSubmissionsNeedingReminder,
  markQuoteReminderSent,
  formatPriceRange,
} from "@/lib/configurator";
import { QuoteReminderEmail } from "@/emails";

/**
 * Get the recipient email - in test mode, all emails go to test email
 */
function getRecipient(email: string): string {
  return RESEND_CONFIG.isTestMode ? DEFAULT_TEST_EMAIL : email;
}

/**
 * Get product display name from slug
 */
function getProductName(productSlug: string): string {
  return productSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Cron job endpoint to send quote reminder emails
 *
 * Runs daily (recommended: around 14:00) via Vercel Cron
 * Sends reminder emails to users who:
 * - Submitted a quote N days ago (configurable)
 * - Haven't booked an appointment
 * - Haven't received a reminder yet
 */
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { daysAfterSubmission } = QUOTE_REMINDER_CONFIG;

    // Get quote submissions that need reminders
    const submissions = await getQuoteSubmissionsNeedingReminder(daysAfterSubmission);

    if (submissions.length === 0) {
      console.log("No quote reminders to send");
      return Response.json({
        success: true,
        reminders_sent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Send reminders and track results
    const results = await Promise.all(
      submissions.map(async (submission) => {
        try {
          // Extract product info from configuration
          const config = submission.configuration as {
            product_slug?: string;
          };
          const productSlug = config.product_slug || "product";
          const productName = getProductName(productSlug);

          // Format price estimate
          const priceEstimate = formatPriceRange(
            submission.price_estimate_min ?? 0,
            submission.price_estimate_max ?? 0
          );

          // Send reminder email
          const { error } = await resend.emails.send({
            from: RESEND_CONFIG.fromAddress,
            to: [getRecipient(submission.contact_email)],
            subject: RESEND_CONFIG.subjects.quoteReminder,
            react: QuoteReminderEmail({
              customerName: submission.contact_name,
              productName,
              priceEstimate,
            }),
          });

          if (error) {
            console.error(
              `Failed to send quote reminder for submission ${submission.id}:`,
              error
            );
            return { id: submission.id, success: false, error: error.message };
          }

          // Mark reminder as sent in database
          await markQuoteReminderSent(submission.id);
          console.log(
            `Quote reminder sent for submission ${submission.id} (${submission.contact_email})`
          );
          return { id: submission.id, success: true };
        } catch (err) {
          console.error(
            `Error processing quote reminder for submission ${submission.id}:`,
            err
          );
          return {
            id: submission.id,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    console.log(
      `Quote reminder job complete: ${successCount} sent, ${failedCount} failed`
    );

    return Response.json({
      success: true,
      reminders_sent: successCount,
      reminders_failed: failedCount,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Quote reminder cron error:", error);
    return Response.json(
      { success: false, error: "Quote reminder job failed" },
      { status: 500 }
    );
  }
}
