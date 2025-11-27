import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { validateFormData, type Subject } from "@/config/contactForm";
import { ContactFormEmail, ContactFormTuinhuizenEmail } from "@/emails";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const subject = (form.get("subject") as Subject) || "Algemeen";

    // Validate using config
    const validationError = validateFormData(form, subject);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Extract common fields
    const name = (form.get("name") as string) || "";
    const email = (form.get("email") as string) || "";
    const phone = (form.get("phone") as string) || "";
    const address = (form.get("address") as string) || "";
    const newsletterOptIn = form.get("newsletterOptIn") === "true";

    // Send email based on subject
    if (subject === "Tuinhuizen") {
      const extraInfo = (form.get("extraInfo") as string) || "";
      const bouwType = (form.get("bouwType") as string) || "Bouwpakket";
      const bekledingHoutsoort =
        (form.get("bekledingHoutsoort") as string) || "";
      const bekledingProfiel = (form.get("bekledingProfiel") as string) || "";
      const grondplan = form.get("grondplan") as File | null;

      // Prepare attachments if grondplan is provided
      const attachments: { filename: string; content: Buffer }[] = [];
      if (grondplan && grondplan.size > 0) {
        const buffer = Buffer.from(await grondplan.arrayBuffer());
        attachments.push({
          filename: grondplan.name,
          content: buffer,
        });
      }

      const { error: emailError } = await resend.emails.send({
        from: RESEND_CONFIG.fromAddressContact,
        to: [RESEND_CONFIG.contactRecipient],
        replyTo: email,
        subject: RESEND_CONFIG.subjects.contactTuinhuizen,
        react: ContactFormTuinhuizenEmail({
          name,
          email,
          phone,
          address,
          extraInfo,
          bouwType,
          bekledingHoutsoort,
          bekledingProfiel,
          newsletterOptIn,
          hasGrondplan: attachments.length > 0,
        }),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (emailError) {
        console.error("Failed to send Tuinhuizen email:", emailError);
        return NextResponse.json(
          { error: "Kon e-mail niet verzenden. Probeer later opnieuw." },
          { status: 500 }
        );
      }
    } else {
      const message = (form.get("message") as string) || "";

      const { error: emailError } = await resend.emails.send({
        from: RESEND_CONFIG.fromAddressContact,
        to: [RESEND_CONFIG.contactRecipient],
        replyTo: email,
        subject: RESEND_CONFIG.subjects.contactAlgemeen,
        react: ContactFormEmail({
          name,
          email,
          phone,
          address,
          message,
        }),
      });

      if (emailError) {
        console.error("Failed to send Algemeen email:", emailError);
        return NextResponse.json(
          { error: "Kon e-mail niet verzenden. Probeer later opnieuw." },
          { status: 500 }
        );
      }
    }

    // Add to newsletter if opted in (for all subjects)
    if (newsletterOptIn && RESEND_CONFIG.audienceId) {
      try {
        await resend.contacts.create({
          email,
          firstName: name.split(" ")[0],
          lastName: name.split(" ").slice(1).join(" ") || undefined,
          unsubscribed: false,
          audienceId: RESEND_CONFIG.audienceId,
        });
      } catch (err) {
        // Don't fail the request if newsletter signup fails
        console.error("Failed to add contact to newsletter:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer later opnieuw." },
      { status: 500 }
    );
  }
}
