import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { NewsletterBroadcast } from "@/emails";
import type { NewsletterSection } from "@/config/newsletter";

const sql = neon(process.env.DATABASE_URL!);

// POST: Send test email to admin
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

    // Send test email to admin
    const { error: emailError } = await resend.emails.send({
      from: RESEND_CONFIG.fromAddressNewsletter,
      to: [RESEND_CONFIG.testEmail],
      subject: `[TEST] ${subject}`,
      react: NewsletterBroadcast({
        preheader: preheader || undefined,
        sections: sections as NewsletterSection[],
      }),
    });

    if (emailError) {
      console.error("Failed to send test email:", emailError);
      return NextResponse.json(
        { error: "Kon test e-mail niet verzenden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
