import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailButton, typography, layout, colors, components } from "@/components/email";

interface AppointmentCancellationProps {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  bookingUrl: string;
}

export function AppointmentCancellation({
  customerName,
  appointmentDate,
  appointmentTime,
  bookingUrl,
}: AppointmentCancellationProps) {
  return (
    <EmailLayout preview={`Uw afspraak op ${appointmentDate} is geannuleerd`}>
      <Section style={layout.content}>
        <Text style={typography.heading}>Afspraak geannuleerd</Text>
        <Text style={typography.subheading}>
          Uw afspraak is succesvol geannuleerd
        </Text>

        <Hr style={layout.divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={typography.paragraph}>
          Uw afspraak bij Assymo is geannuleerd. Hieronder vindt u de details
          van de geannuleerde afspraak.
        </Text>

        <Section style={cancelledBox}>
          <Text style={cancelledLabel}>Geannuleerde afspraak</Text>
          <Text style={cancelledValue}>
            {appointmentDate} om {appointmentTime}
          </Text>
        </Section>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Wilt u een nieuwe afspraak maken? Klik op onderstaande knop:
        </Text>

        <EmailButton href={bookingUrl}>Nieuwe afspraak maken</EmailButton>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Heeft u vragen? Stuur gerust een mailtje naar:{" "}
          <Link href="mailto:info@assymo.be" style={components.link}>
            info@assymo.be
          </Link>
          .
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

export default AppointmentCancellation;

const greeting = {
  fontSize: "16px",
  color: colors.primary,
  margin: "0 0 16px 0",
  fontWeight: "600" as const,
};

const cancelledBox = {
  backgroundColor: "#fee2e2",
  padding: "24px",
  borderRadius: "8px",
  margin: "16px 0",
};

const cancelledLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#991b1b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const cancelledValue = {
  fontSize: "18px",
  color: colors.primary,
  margin: "0",
  fontWeight: "500" as const,
  textDecoration: "line-through" as const,
};

