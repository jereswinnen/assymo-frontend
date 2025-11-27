import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

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
      <Section style={content}>
        <Text style={heading}>Nieuw contactformulier</Text>
        <Text style={subheading}>Algemeen</Text>

        <Hr style={divider} />

        <Text style={label}>Naam</Text>
        <Text style={value}>{name}</Text>

        <Text style={label}>E-mail</Text>
        <Text style={value}>{email}</Text>

        <Text style={label}>Telefoon</Text>
        <Text style={value}>{phone}</Text>

        <Text style={label}>Adres</Text>
        <Text style={value}>{address}</Text>

        <Hr style={divider} />

        <Text style={label}>Bericht</Text>
        <Text style={messageStyle}>{message}</Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormEmail;

const content = {
  padding: "32px 48px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1f3632",
  margin: "0 0 8px 0",
};

const subheading = {
  fontSize: "14px",
  color: "#8898aa",
  margin: "0 0 24px 0",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const label = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#8898aa",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const value = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "0 0 16px 0",
};

const messageStyle = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
  backgroundColor: "#f6f9fc",
  padding: "16px",
  borderRadius: "4px",
};
