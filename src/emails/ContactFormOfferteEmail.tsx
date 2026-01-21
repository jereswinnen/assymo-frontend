import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { MessageBox, typography, layout, colors, components } from "@/components/email";

interface ContactFormOfferteEmailProps {
  name: string;
  email: string;
  phone: string;
  address: string;
  product: string;
  budget?: string;
  extraInfo?: string;
  newsletterOptIn: boolean;
  hasBestand: boolean;
  bestandNaam?: string;
}

export function ContactFormOfferteEmail({
  name,
  email,
  phone,
  address,
  product,
  budget,
  extraInfo,
  newsletterOptIn,
  hasBestand,
  bestandNaam,
}: ContactFormOfferteEmailProps) {
  return (
    <EmailLayout preview={`Offerteaanvraag van ${name} voor ${product}`}>
      <Section style={layout.content}>
        <Text style={typography.heading}>Nieuw contactformulier</Text>
        <Text style={typography.subheading}>Offerte aanvragen</Text>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Contactgegevens</Text>

        <Text style={typography.label}>Naam</Text>
        <Text style={typography.value}>{name}</Text>

        <Text style={typography.label}>E-mail</Text>
        <Text style={typography.value}>
          <Link href={`mailto:${email}`} style={components.link}>
            {email}
          </Link>
        </Text>

        <Text style={typography.label}>Telefoon</Text>
        <Text style={typography.value}>
          <Link href={`tel:${phone}`} style={components.link}>
            {phone}
          </Link>
        </Text>

        <Text style={typography.label}>Adres</Text>
        <Text style={typography.value}>
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            style={components.link}
          >
            {address}
          </Link>
        </Text>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Offertegegevens</Text>

        <Text style={typography.label}>Product</Text>
        <Text style={typography.value}>{product}</Text>

        {budget && (
          <>
            <Text style={typography.label}>Budget</Text>
            <Text style={typography.value}>{budget}</Text>
          </>
        )}

        {hasBestand && (
          <>
            <Text style={typography.label}>Bijlage</Text>
            <Text style={typography.value}>
              {bestandNaam || "Bestand bijgevoegd"}
            </Text>
          </>
        )}

        {extraInfo && (
          <>
            <Hr style={layout.divider} />
            <Text style={typography.label}>Extra informatie</Text>
            <MessageBox>{extraInfo}</MessageBox>
          </>
        )}

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Extra opties</Text>

        <Text style={typography.value}>
          Nieuwsbrief: {newsletterOptIn ? "Ja, graag" : "Nee"}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormOfferteEmail;

const sectionTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: colors.primary,
  margin: "0 0 16px 0",
};
