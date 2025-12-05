import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { MessageBox, typography, layout, components } from "@/components/email";

interface ContactFormEmailProps {
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
}

export function ContactFormEmail({
  name,
  email,
  phone,
  address,
  message,
}: ContactFormEmailProps) {
  return (
    <EmailLayout preview={`Nieuw bericht van ${name}`}>
      <Section style={layout.content}>
        <Text style={typography.heading}>Nieuw contactformulier</Text>
        <Text style={typography.subheading}>Algemeen</Text>

        <Hr style={layout.divider} />

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

        <Text style={typography.label}>Bericht</Text>
        <MessageBox>{message}</MessageBox>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormEmail;
