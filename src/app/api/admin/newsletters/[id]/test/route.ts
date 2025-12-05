import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG, DEFAULT_TEST_EMAIL } from "@/config/resend";
import { NewsletterBroadcast } from "@/emails";
import { getUnsubscribeUrl, type NewsletterSection } from "@/config/newsletter";

const sql = neon(process.env.DATABASE_URL!);

// POST: Send test email to specified address (or default)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const newsletterId = parseInt(id, 10);

    if (isNaN(newsletterId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Get email from request body (frontend passes from Settings)
    const body = await req.json().catch(() => ({}));
    const testEmail = body.email?.trim() || DEFAULT_TEST_EMAIL;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: "Ongeldig e-mailadres" },
        { status: 400 }
      );
    }

    // Fetch the newsletter
    const rows = await sql`
      SELECT subject, preheader, sections
      FROM newsletters
      WHERE id = ${newsletterId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { subject, preheader, sections } = rows[0];

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Onderwerp is verplicht" },
        { status: 400 }
      );
    }

    // Send test email (use placeholder ID for test - unsubscribe won't work but that's fine for testing)
    const testContactId = "test-preview";
    const { error: emailError } = await resend.emails.send({
      from: RESEND_CONFIG.fromAddressNewsletter,
      to: [testEmail],
      subject: `[TEST] ${subject}`,
      headers: {
        "List-Unsubscribe": `<${getUnsubscribeUrl(testContactId)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      react: NewsletterBroadcast({
        preheader: preheader || undefined,
        sections: sections as NewsletterSection[],
        contactId: testContactId,
      }),
    });

    if (emailError) {
      console.error("Failed to send test email:", emailError);
      return NextResponse.json(
        { error: "Kon test e-mail niet verzenden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sentTo: testEmail });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
