import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";

// GET: Get subscriber count from Resend audience
export async function GET(req: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RESEND_CONFIG.audienceId) {
      return NextResponse.json(
        { error: "Audience ID not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await resend.contacts.list({
      audienceId: RESEND_CONFIG.audienceId,
    });

    if (error) {
      console.error("Failed to fetch contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    // Filter out unsubscribed contacts
    const activeContacts = data?.data?.filter((c) => !c.unsubscribed) || [];

    return NextResponse.json({
      count: activeContacts.length,
      contacts: activeContacts,
    });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
