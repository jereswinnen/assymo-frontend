import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { MessageBox, typography, layout } from "@/components/email";

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
        <Text style={typography.value}>{email}</Text>

        <Text style={typography.label}>Telefoon</Text>
        <Text style={typography.value}>{phone}</Text>

        <Text style={typography.label}>Adres</Text>
        <Text style={typography.value}>{address}</Text>

        <Hr style={layout.divider} />

        <Text style={typography.label}>Bericht</Text>
        <MessageBox>{message}</MessageBox>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormEmail;
