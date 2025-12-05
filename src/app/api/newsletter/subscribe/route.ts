import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { getUnsubscribeUrl } from "@/config/newsletter";
import { NewsletterWelcome } from "@/emails";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ongeldig e-mailadres" },
        { status: 400 }
      );
    }

    if (!RESEND_CONFIG.audienceId) {
      console.error("RESEND_AUDIENCE_ID is not configured");
      return NextResponse.json(
        { error: "Nieuwsbrief is tijdelijk niet beschikbaar" },
        { status: 500 }
      );
    }

    // Add contact to Resend audience
    const { data: contact, error: contactError } = await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: RESEND_CONFIG.audienceId,
    });

    if (contactError) {
      // Check if contact already exists (not an error for UX)
      if (contactError.message?.includes("already exists")) {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }

      console.error("Failed to create contact:", contactError);
      return NextResponse.json(
        { error: "Kon niet inschrijven. Probeer later opnieuw." },
        { status: 500 }
      );
    }

    // Send welcome email (only if we have a contact ID)
    if (contact?.id) {
      const { error: emailError } = await resend.emails.send({
        from: RESEND_CONFIG.fromAddressNewsletter,
        to: [email],
        subject: RESEND_CONFIG.subjects.newsletterWelcome,
        headers: {
          "List-Unsubscribe": `<${getUnsubscribeUrl(contact.id)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        react: NewsletterWelcome({ email, contactId: contact.id }),
      });

      if (emailError) {
        // Log but don't fail - contact was added successfully
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json({ success: true, contactId: contact?.id });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer later opnieuw." },
      { status: 500 }
    );
  }
}
