import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import {
  EmailButton,
  typography,
  layout,
  colors,
  components,
} from "@/components/email";

interface PasswordResetProps {
  resetUrl: string;
}

export function PasswordReset({ resetUrl }: PasswordResetProps) {
  return (
    <EmailLayout preview="Reset je wachtwoord voor Assymo Admin">
      <Section style={layout.content}>
        <Text style={typography.heading}>Wachtwoord resetten</Text>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op
          onderstaande knop om een nieuw wachtwoord in te stellen.
        </Text>

        <EmailButton href={resetUrl}>Wachtwoord resetten</EmailButton>

        <Text style={smallText}>
          Deze link is 1 uur geldig. Als je geen wachtwoord reset hebt
          aangevraagd, kun je deze email negeren.
        </Text>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Vragen? Neem contact op via{" "}
          <Link href="mailto:info@assymo.be" style={components.link}>
            info@assymo.be
          </Link>
        </Text>

        <Text style={typography.signature}>
          Met vriendelijke groeten,
          <br />
          Het Assymo team
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PasswordReset;

const smallText = {
  fontSize: "12px",
  color: colors.muted,
  margin: "16px 0",
};
