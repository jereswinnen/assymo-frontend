import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";

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

export async function unsubscribeContact(contactId: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_CONFIG.audienceId) {
    console.error("RESEND_AUDIENCE_ID is not configured");
    return { success: false, error: "Configuratiefout" };
  }

  try {
    // Update contact to unsubscribed by ID
    const { error } = await resend.contacts.update({
      audienceId: RESEND_CONFIG.audienceId,
      id: contactId,
      unsubscribed: true,
    });

    if (error) {
      console.error("Failed to unsubscribe contact:", error);
      return { success: false, error: "Kon niet uitschrijven. Probeer later opnieuw." };
    }

    return { success: true };
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return { success: false, error: "Er is iets misgegaan." };
  }
}
