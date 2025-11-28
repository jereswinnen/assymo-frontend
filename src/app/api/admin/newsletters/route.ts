import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth";
import type { Newsletter, NewsletterSection } from "@/config/newsletter";

const sql = neon(process.env.DATABASE_URL!);

// GET: List newsletters (default: drafts, or sent if ?status=sent)
export async function GET(req: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "draft";

    const rows = await sql`
      SELECT
        id,
        subject,
        preheader,
        sections,
        status,
        subscriber_count,
        resend_email_id,
        created_at,
        sent_at
      FROM newsletters
      WHERE status = ${status}
      ORDER BY ${status === "sent" ? sql`sent_at` : sql`created_at`} DESC
    `;

    const newsletters: Newsletter[] = rows.map((row) => ({
      id: row.id,
      subject: row.subject || "",
      preheader: row.preheader,
      sections: row.sections as NewsletterSection[],
      status: row.status,
      subscriberCount: row.subscriber_count,
      resendEmailId: row.resend_email_id,
      createdAt: new Date(row.created_at),
      sentAt: row.sent_at ? new Date(row.sent_at) : null,
    }));

    return NextResponse.json({ newsletters });
  } catch (error) {
    console.error("Failed to fetch newsletters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new draft newsletter
export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, preheader, sections } = body;

    const rows = await sql`
      INSERT INTO newsletters (subject, preheader, sections, status)
      VALUES (${subject || ""}, ${preheader || null}, ${JSON.stringify(sections || [])}, 'draft')
      RETURNING
        id,
        subject,
        preheader,
        sections,
        status,
        subscriber_count,
        resend_email_id,
        created_at,
        sent_at
    `;

    const row = rows[0];
    const newsletter: Newsletter = {
      id: row.id,
      subject: row.subject || "",
      preheader: row.preheader,
      sections: row.sections as NewsletterSection[],
      status: row.status,
      subscriberCount: row.subscriber_count,
      resendEmailId: row.resend_email_id,
      createdAt: new Date(row.created_at),
      sentAt: row.sent_at ? new Date(row.sent_at) : null,
    };

    return NextResponse.json({ newsletter }, { status: 201 });
  } catch (error) {
    console.error("Failed to create newsletter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
