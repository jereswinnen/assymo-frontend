import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { NewsletterBroadcast } from "@/emails";
import { getUnsubscribeUrl, type NewsletterSection } from "@/config/newsletter";

const sql = neon(process.env.DATABASE_URL!);

// POST: Send newsletter to all subscribers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await protectRoute({ feature: "emails" });
    if (!authorized) return response;

    const { id } = await params;
    const newsletterId = parseInt(id, 10);

    if (isNaN(newsletterId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Fetch the newsletter
    const rows = await sql`
      SELECT id, subject, preheader, sections, status
      FROM newsletters
      WHERE id = ${newsletterId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const newsletter = rows[0];

    if (newsletter.status === "sent") {
      return NextResponse.json(
        { error: "Newsletter is al verzonden" },
        { status: 400 }
      );
    }

    if (!newsletter.subject?.trim()) {
      return NextResponse.json(
        { error: "Onderwerp is verplicht" },
        { status: 400 }
      );
    }

    // Fetch subscribers from Resend
    if (!RESEND_CONFIG.audienceId) {
      return NextResponse.json(
        { error: "Audience ID not configured" },
        { status: 500 }
      );
    }

    const { data: contactsData, error: contactsError } =
      await resend.contacts.list({
        audienceId: RESEND_CONFIG.audienceId,
      });

    if (contactsError) {
      console.error("Failed to fetch contacts:", contactsError);
      return NextResponse.json(
        { error: "Kon abonnees niet ophalen" },
        { status: 500 }
      );
    }

    const activeContacts =
      contactsData?.data?.filter((c) => !c.unsubscribed) || [];

    if (activeContacts.length === 0) {
      return NextResponse.json(
        { error: "Geen actieve abonnees gevonden" },
        { status: 400 }
      );
    }

    // Send emails in batches (Resend batch limit is 100)
    const batchSize = 100;
    let firstEmailId: string | null = null;
    let totalSent = 0;

    for (let i = 0; i < activeContacts.length; i += batchSize) {
      const batch = activeContacts.slice(i, i + batchSize);

      const emails = batch.map((contact) => ({
        from: RESEND_CONFIG.fromAddressNewsletter,
        to: [contact.email],
        subject: newsletter.subject,
        headers: {
          "List-Unsubscribe": `<${getUnsubscribeUrl(contact.id)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        react: NewsletterBroadcast({
          preheader: newsletter.preheader || undefined,
          sections: newsletter.sections as NewsletterSection[],
          contactId: contact.id,
        }),
      }));

      const { data: batchData, error: batchError } =
        await resend.batch.send(emails);

      if (batchError) {
        console.error("Batch send error:", batchError);
        // Continue with other batches even if one fails
      } else {
        totalSent += batch.length;
        // Store the first email ID for reference
        if (!firstEmailId && batchData?.data?.[0]?.id) {
          firstEmailId = batchData.data[0].id;
        }
      }
    }

    // Update newsletter status
    await sql`
      UPDATE newsletters
      SET
        status = 'sent',
        subscriber_count = ${totalSent},
        resend_email_id = ${firstEmailId},
        sent_at = NOW()
      WHERE id = ${newsletterId}
    `;

    return NextResponse.json({
      success: true,
      sent: totalSent,
      total: activeContacts.length,
    });
  } catch (error) {
    console.error("Failed to send broadcast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
