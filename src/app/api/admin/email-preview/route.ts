import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { protectRoute } from "@/lib/permissions";
import {
  AppointmentConfirmation,
  AppointmentAdminNotification,
  AppointmentCancellation,
  AppointmentUpdated,
  NewsletterWelcome,
  NewsletterBroadcast,
  ContactFormEmail,
  ContactFormTuinhuizenEmail,
} from "@/emails";

// Sample data for each email template
const sampleData = {
  "appointment-confirmation": {
    customerName: "Jan Janssen",
    appointmentDate: "dinsdag 15 januari 2025",
    appointmentTime: "14:00 uur",
    storeAddress: "Eikenlei 159, 2960 Brecht",
    editUrl: "https://assymo.be/afspraak/abc123",
  },
  "appointment-admin": {
    customerName: "Jan Janssen",
    customerEmail: "jan.janssen@email.be",
    customerPhone: "+32 123 45 67 89",
    customerStreet: "Voorbeeldstraat 42",
    customerPostalCode: "2000",
    customerCity: "Antwerpen",
    appointmentDate: "dinsdag 15 januari 2025",
    appointmentTime: "14:00 uur",
    remarks: "Ik ben geïnteresseerd in een tuinhuis van 3x4 meter.",
  },
  "appointment-cancellation": {
    customerName: "Jan Janssen",
    appointmentDate: "dinsdag 15 januari 2025",
    appointmentTime: "14:00 uur",
    bookingUrl: "https://assymo.be/afspraak",
  },
  "appointment-updated": {
    customerName: "Jan Janssen",
    appointmentDate: "woensdag 16 januari 2025",
    appointmentTime: "10:00 uur",
    storeAddress: "Eikenlei 159, 2960 Brecht",
    previousDate: "dinsdag 15 januari 2025",
    previousTime: "14:00 uur",
    editUrl: "https://assymo.be/afspraak/abc123",
  },
  "newsletter-welcome": {
    email: "voorbeeld@email.be",
    contactId: "preview-contact-id",
  },
  "newsletter-broadcast": {
    preheader: "Ontdek onze nieuwe collectie tuinhuizen",
    sections: [
      {
        id: "1",
        title: "Nieuwe collectie tuinhuizen",
        text: "Ontdek onze prachtige nieuwe collectie houten tuinhuizen. Gemaakt met de hoogste kwaliteit materialen en vakmanschap.",
        ctaUrl: "https://assymo.be/oplossingen",
        ctaText: "Bekijk de collectie",
      },
      {
        id: "2",
        title: "Winteractie: 10% korting",
        text: "Profiteer nu van 10% korting op alle tuinhuizen. Actie geldig tot eind januari.",
      },
    ],
    contactId: "preview-contact-id",
  },
  "contact-form": {
    name: "Jan Janssen",
    email: "jan.janssen@email.be",
    phone: "+32 123 45 67 89",
    address: "Voorbeeldstraat 42, 2000 Antwerpen",
    message:
      "Beste,\n\nIk ben geïnteresseerd in een offerte voor een tuinhuis.\n\nMet vriendelijke groeten,\nJan",
  },
  "contact-form-tuinhuizen": {
    name: "Jan Janssen",
    email: "jan.janssen@email.be",
    phone: "+32 123 45 67 89",
    address: "Voorbeeldstraat 42, 2000 Antwerpen",
    extraInfo: "Ik wil graag een tuinhuis van 3x4 meter met een luifel.",
    bouwType: "Geplaatst",
    bekledingHoutsoort: "Thermowood",
    bekledingProfiel: "Horizontaal",
    newsletterOptIn: true,
    hasGrondplan: false,
  },
};

// Map template names to components
const templates: Record<string, (props: unknown) => React.ReactElement> = {
  "appointment-confirmation": (props) =>
    AppointmentConfirmation(
      props as Parameters<typeof AppointmentConfirmation>[0]
    ),
  "appointment-admin": (props) =>
    AppointmentAdminNotification(
      props as Parameters<typeof AppointmentAdminNotification>[0]
    ),
  "appointment-cancellation": (props) =>
    AppointmentCancellation(
      props as Parameters<typeof AppointmentCancellation>[0]
    ),
  "appointment-updated": (props) =>
    AppointmentUpdated(props as Parameters<typeof AppointmentUpdated>[0]),
  "newsletter-welcome": (props) =>
    NewsletterWelcome(props as Parameters<typeof NewsletterWelcome>[0]),
  "newsletter-broadcast": (props) =>
    NewsletterBroadcast(props as Parameters<typeof NewsletterBroadcast>[0]),
  "contact-form": (props) =>
    ContactFormEmail(props as Parameters<typeof ContactFormEmail>[0]),
  "contact-form-tuinhuizen": (props) =>
    ContactFormTuinhuizenEmail(
      props as Parameters<typeof ContactFormTuinhuizenEmail>[0]
    ),
};

const templateList = [
  { id: "appointment-confirmation", name: "Afspraak bevestiging" },
  { id: "appointment-admin", name: "Afspraak admin notificatie" },
  { id: "appointment-cancellation", name: "Afspraak annulering" },
  { id: "appointment-updated", name: "Afspraak gewijzigd" },
  { id: "newsletter-welcome", name: "Nieuwsbrief welkom" },
  { id: "newsletter-broadcast", name: "Nieuwsbrief broadcast" },
  { id: "contact-form", name: "Contactformulier algemeen" },
  { id: "contact-form-tuinhuizen", name: "Contactformulier tuinhuizen" },
];

// GET: Get list of available templates or render a specific one
export async function GET(req: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "emails" });
    if (!authorized) return response;

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("template");

    // If no template specified, return list of available templates
    if (!templateId) {
      return NextResponse.json({ templates: templateList });
    }

    // Check if template exists
    const templateFn = templates[templateId];
    const data = sampleData[templateId as keyof typeof sampleData];

    if (!templateFn || !data) {
      return NextResponse.json(
        { error: "Template niet gevonden" },
        { status: 404 }
      );
    }

    // Render the email to HTML
    const html = await render(templateFn(data));

    return NextResponse.json({ html, templateId });
  } catch (error) {
    console.error("Failed to render email preview:", error);
    return NextResponse.json(
      { error: "Kon e-mail preview niet genereren" },
      { status: 500 }
    );
  }
}
