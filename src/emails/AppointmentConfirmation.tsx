import { Section, Text, Hr, Button } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface AppointmentConfirmationProps {
  customerName: string;
  appointmentDate: string; // Formatted Dutch date, e.g., "dinsdag 15 januari 2025"
  appointmentTime: string; // e.g., "14:00 uur"
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
      <Section style={content}>
        <Text style={heading}>Afspraak bevestigd</Text>
        <Text style={subheading}>Bedankt voor uw reservering</Text>

        <Hr style={divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={paragraph}>
          Uw afspraak bij Assymo is bevestigd. We kijken ernaar uit u te
          ontvangen!
        </Text>

        <Section style={appointmentBox}>
          <Text style={appointmentLabel}>Datum</Text>
          <Text style={appointmentValue}>{appointmentDate}</Text>

          <Text style={appointmentLabel}>Tijdstip</Text>
          <Text style={appointmentValue}>{appointmentTime}</Text>

          <Text style={appointmentLabel}>Locatie</Text>
          <Text style={appointmentValue}>{storeLocation}</Text>
        </Section>

        <Hr style={divider} />

        <Text style={paragraph}>
          Moet u uw afspraak wijzigen of annuleren? Gebruik onderstaande knop:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={editUrl}>
            Afspraak beheren
          </Button>
        </Section>

        <Text style={smallText}>
          Of kopieer deze link naar uw browser:{" "}
          <span style={linkText}>{editUrl}</span>
        </Text>

        <Hr style={divider} />

        <Text style={paragraph}>
          Heeft u vragen? Neem gerust contact met ons op via info@assymo.be.
        </Text>

        <Text style={signature}>
          Met vriendelijke groeten,
          <br />
          Het Assymo team
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default AppointmentConfirmation;

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

const greeting = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "0 0 16px 0",
  fontWeight: "600" as const,
};

const paragraph = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "0 0 16px 0",
  lineHeight: "1.5",
};

const appointmentBox = {
  backgroundColor: "#f6f9fc",
  padding: "24px",
  borderRadius: "8px",
  margin: "16px 0",
};

const appointmentLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#8898aa",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const appointmentValue = {
  fontSize: "18px",
  color: "#1f3632",
  margin: "0 0 16px 0",
  fontWeight: "500" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#1f3632",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
};

const smallText = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "0 0 16px 0",
  wordBreak: "break-all" as const,
};

const linkText = {
  color: "#1f3632",
};

const signature = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "24px 0 0 0",
  lineHeight: "1.5",
};
