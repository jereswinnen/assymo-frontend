import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { protectRoute } from "@/lib/permissions";
import type { Newsletter, NewsletterSection } from "@/config/newsletter";

// GET: Get a single newsletter
export async function GET(
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
      WHERE id = ${newsletterId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error("Failed to fetch newsletter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update a newsletter draft
export async function PUT(
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

    const body = await req.json();
    const { subject, preheader, sections } = body;

    const rows = await sql`
      UPDATE newsletters
      SET
        subject = ${subject || ""},
        preheader = ${preheader || null},
        sections = ${JSON.stringify(sections || [])}
      WHERE id = ${newsletterId} AND status = 'draft'
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

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Not found or already sent" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error("Failed to update newsletter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a newsletter draft
export async function DELETE(
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

    const result = await sql`
      DELETE FROM newsletters
      WHERE id = ${newsletterId} AND status = 'draft'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete newsletter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
