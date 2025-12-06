import { NextRequest, NextResponse } from "next/server";
import { unsubscribeContact } from "@/lib/newsletter";

/**
 * Newsletter unsubscribe API endpoint
 *
 * Handles POST requests for one-click unsubscribe (RFC 8058).
 * GET requests are handled by the /nieuwsbrief/uitschrijven page.
 */

// POST: One-click unsubscribe (used by email client buttons)
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("id");

  if (!contactId) {
    return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
  }

  const result = await unsubscribeContact(contactId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Return 200 with empty body as per RFC 8058
  return new NextResponse(null, { status: 200 });
}
