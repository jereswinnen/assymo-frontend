import { Section, Text, Hr, Button } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface AppointmentCancellationProps {
  customerName: string;
  appointmentDate: string; // Formatted Dutch date
  appointmentTime: string; // e.g., "14:00 uur"
  bookingUrl: string; // URL to book a new appointment
}

export function AppointmentCancellation({
  customerName,
  appointmentDate,
  appointmentTime,
  bookingUrl,
}: AppointmentCancellationProps) {
  return (
    <EmailLayout preview={`Uw afspraak op ${appointmentDate} is geannuleerd`}>
      <Section style={content}>
        <Text style={heading}>Afspraak geannuleerd</Text>
        <Text style={subheading}>Uw afspraak is succesvol geannuleerd</Text>

        <Hr style={divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={paragraph}>
          Uw afspraak bij Assymo is geannuleerd. Hieronder vindt u de details
          van de geannuleerde afspraak.
        </Text>

        <Section style={appointmentBox}>
          <Text style={appointmentLabel}>Geannuleerde afspraak</Text>
          <Text style={appointmentValue}>
            {appointmentDate} om {appointmentTime}
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={paragraph}>
          Wilt u een nieuwe afspraak maken? Klik op onderstaande knop:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={bookingUrl}>
            Nieuwe afspraak maken
          </Button>
        </Section>

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

export default AppointmentCancellation;

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
  backgroundColor: "#fee2e2",
  padding: "24px",
  borderRadius: "8px",
  margin: "16px 0",
};

const appointmentLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#991b1b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const appointmentValue = {
  fontSize: "18px",
  color: "#1f3632",
  margin: "0",
  fontWeight: "500" as const,
  textDecoration: "line-through" as const,
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

const signature = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "24px 0 0 0",
  lineHeight: "1.5",
};
