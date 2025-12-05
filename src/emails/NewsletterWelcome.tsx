import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailButton, typography, layout, colors } from "@/components/email";

interface NewsletterWelcomeProps {
  email: string;
}

export function NewsletterWelcome({ email }: NewsletterWelcomeProps) {
  return (
    <EmailLayout preview="Welkom bij de Assymo nieuwsbrief!">
      <Section style={layout.content}>
        <Text style={typography.heading}>Welkom bij Assymo!</Text>

        <Text style={paragraph}>
          Bedankt voor je inschrijving op onze nieuwsbrief. Je ontvangt voortaan
          handige weetjes en blijft op de hoogte van onze promoties.
        </Text>

        <Hr style={layout.divider} />

        <Text style={paragraph}>
          Bij Assymo maken we houten tuingebouwen op maat: tuinhuisjes,
          overkappingen, pergola&apos;s, carports en schuren. Allemaal met de
          hoogste kwaliteit hout en vakmanschap.
        </Text>

        <EmailButton href="https://assymo.be/oplossingen">
          Bekijk onze oplossingen
        </EmailButton>

        <Hr style={layout.divider} />

        <Text style={typography.small}>
          Je ontvangt deze e-mail omdat je je hebt ingeschreven voor de
          nieuwsbrief met het adres {email}. Wil je geen e-mails meer ontvangen?
          Je kunt je altijd uitschrijven via de link onderaan onze
          nieuwsbrieven.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default NewsletterWelcome;

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: colors.text,
  margin: "0 0 16px 0",
};
