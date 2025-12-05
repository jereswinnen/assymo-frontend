import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { MessageBox, typography, layout, colors } from "@/components/email";

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
      <Section style={layout.content}>
        <Text style={typography.heading}>Nieuw contactformulier</Text>
        <Text style={typography.subheading}>Tuinhuizen</Text>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Contactgegevens</Text>

        <Text style={typography.label}>Naam</Text>
        <Text style={typography.value}>{name}</Text>

        <Text style={typography.label}>E-mail</Text>
        <Text style={typography.value}>{email}</Text>

        <Text style={typography.label}>Telefoon</Text>
        <Text style={typography.value}>{phone}</Text>

        <Text style={typography.label}>Adres</Text>
        <Text style={typography.value}>{address}</Text>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Tuinhuis specificaties</Text>

        <Text style={typography.label}>Bouwpakket of geplaatst</Text>
        <Text style={typography.value}>{bouwType}</Text>

        {bekledingHoutsoort && (
          <>
            <Text style={typography.label}>Bekledingen: houtsoort</Text>
            <Text style={typography.value}>{bekledingHoutsoort}</Text>
          </>
        )}

        {bekledingProfiel && (
          <>
            <Text style={typography.label}>Bekledingen: profiel</Text>
            <Text style={typography.value}>{bekledingProfiel}</Text>
          </>
        )}

        <Hr style={layout.divider} />

        <Text style={typography.label}>Extra informatie</Text>
        <MessageBox>{extraInfo}</MessageBox>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Extra opties</Text>

        <Text style={typography.value}>
          Grondplan bijgevoegd: {hasGrondplan ? "Ja" : "Nee"}
        </Text>
        <Text style={typography.value}>
          Nieuwsbrief: {newsletterOptIn ? "Ja, graag" : "Nee"}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormTuinhuizenEmail;

const sectionTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: colors.primary,
  margin: "0 0 16px 0",
};
