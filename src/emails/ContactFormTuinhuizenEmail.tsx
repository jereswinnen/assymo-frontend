import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface ContactFormTuinhuizenEmailProps {
  name: string;
  email: string;
  phone: string;
  address: string;
  extraInfo: string;
  bouwType: string;
  bekledingHoutsoort: string;
  bekledingProfiel: string;
  newsletterOptIn: boolean;
  hasGrondplan: boolean;
}

export function ContactFormTuinhuizenEmail({
  name,
  email,
  phone,
  address,
  extraInfo,
  bouwType,
  bekledingHoutsoort,
  bekledingProfiel,
  newsletterOptIn,
  hasGrondplan,
}: ContactFormTuinhuizenEmailProps) {
  return (
    <EmailLayout preview={`Tuinhuizen aanvraag van ${name}`}>
      <Section style={content}>
        <Text style={heading}>Nieuw contactformulier</Text>
        <Text style={subheading}>Tuinhuizen</Text>

        <Hr style={divider} />

        <Text style={sectionTitle}>Contactgegevens</Text>

        <Text style={label}>Naam</Text>
        <Text style={value}>{name}</Text>

        <Text style={label}>E-mail</Text>
        <Text style={value}>{email}</Text>

        <Text style={label}>Telefoon</Text>
        <Text style={value}>{phone}</Text>

        <Text style={label}>Adres</Text>
        <Text style={value}>{address}</Text>

        <Hr style={divider} />

        <Text style={sectionTitle}>Tuinhuis specificaties</Text>

        <Text style={label}>Bouwpakket of geplaatst</Text>
        <Text style={value}>{bouwType}</Text>

        {bekledingHoutsoort && (
          <>
            <Text style={label}>Bekledingen: houtsoort</Text>
            <Text style={value}>{bekledingHoutsoort}</Text>
          </>
        )}

        {bekledingProfiel && (
          <>
            <Text style={label}>Bekledingen: profiel</Text>
            <Text style={value}>{bekledingProfiel}</Text>
          </>
        )}

        <Hr style={divider} />

        <Text style={label}>Extra informatie</Text>
        <Text style={messageStyle}>{extraInfo}</Text>

        <Hr style={divider} />

        <Text style={sectionTitle}>Extra opties</Text>

        <Text style={value}>
          Grondplan bijgevoegd: {hasGrondplan ? "Ja" : "Nee"}
        </Text>
        <Text style={value}>
          Nieuwsbrief: {newsletterOptIn ? "Ja, graag" : "Nee"}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormTuinhuizenEmail;

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

const sectionTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#1f3632",
  margin: "0 0 16px 0",
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
