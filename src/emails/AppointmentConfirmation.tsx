import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import {
  InfoBox,
  InfoRow,
  EmailButton,
  typography,
  layout,
  colors,
} from "@/components/email";

interface AppointmentConfirmationProps {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  storeLocation: string;
  editUrl: string;
}

export function AppointmentConfirmation({
  customerName,
  appointmentDate,
  appointmentTime,
  storeLocation,
  editUrl,
}: AppointmentConfirmationProps) {
  return (
    <EmailLayout preview={`Uw afspraak bij Assymo op ${appointmentDate}`}>
      <Section style={layout.content}>
        <Text style={typography.heading}>Afspraak bevestigd</Text>
        <Text style={typography.subheading}>Bedankt voor uw reservering</Text>

        <Hr style={layout.divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={typography.paragraph}>
          Uw afspraak bij Assymo is bevestigd. We kijken ernaar uit u te
          ontvangen!
        </Text>

        <InfoBox>
          <InfoRow label="Datum" value={appointmentDate} />
          <InfoRow label="Tijdstip" value={appointmentTime} />
          <InfoRow label="Locatie" value={storeLocation} />
        </InfoBox>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Moet u uw afspraak wijzigen of annuleren? Gebruik onderstaande knop:
        </Text>

        <EmailButton href={editUrl}>Afspraak beheren</EmailButton>

        <Text style={smallText}>
          Of kopieer deze link naar uw browser:{" "}
          <span style={linkText}>{editUrl}</span>
        </Text>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Heeft u vragen? Neem gerust contact met ons op via info@assymo.be.
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

export default AppointmentConfirmation;

const greeting = {
  fontSize: "16px",
  color: colors.primary,
  margin: "0 0 16px 0",
  fontWeight: "600" as const,
};

const smallText = {
  fontSize: "12px",
  color: colors.muted,
  margin: "0 0 16px 0",
  wordBreak: "break-all" as const,
};

const linkText = {
  color: colors.primary,
};
