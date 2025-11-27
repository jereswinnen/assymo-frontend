import { Section, Text, Hr, Button } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface NewsletterWelcomeProps {
  email: string;
}

export function NewsletterWelcome({ email }: NewsletterWelcomeProps) {
  return (
    <EmailLayout preview="Welkom bij de Assymo nieuwsbrief!">
      <Section style={content}>
        <Text style={heading}>Welkom bij Assymo!</Text>

        <Text style={paragraph}>
          Bedankt voor je inschrijving op onze nieuwsbrief. Je ontvangt voortaan
          handige weetjes en blijft op de hoogte van onze promoties.
        </Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Bij Assymo maken we houten tuingebouwen op maat: tuinhuisjes,
          overkappingen, pergola&apos;s, carports en schuren. Allemaal met de
          hoogste kwaliteit hout en vakmanschap.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://assymo.be/oplossingen">
            Bekijk onze oplossingen
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
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

const content = {
  padding: "32px 48px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1f3632",
  margin: "0 0 24px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
  margin: "0 0 16px 0",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1f3632",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
};

const smallText = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "0",
};
