import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import {
  HighlightBox,
  MessageBox,
  typography,
  layout,
  colors,
  components,
} from "@/components/email";

interface AppointmentAdminNotificationProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerStreet: string;
  customerPostalCode: string;
  customerCity: string;
  appointmentDate: string;
  appointmentTime: string;
  remarks?: string | null;
}

export function AppointmentAdminNotification({
  customerName,
  customerEmail,
  customerPhone,
  customerStreet,
  customerPostalCode,
  customerCity,
  appointmentDate,
  appointmentTime,
  remarks,
}: AppointmentAdminNotificationProps) {
  return (
    <EmailLayout
      preview={`Nieuwe afspraak: ${customerName} op ${appointmentDate}`}
    >
      <Section style={layout.content}>
        <Text style={typography.heading}>Nieuwe afspraak</Text>
        <Text style={typography.subheading}>
          Er is een nieuwe afspraak ingepland
        </Text>

        <Hr style={layout.divider} />

        <HighlightBox>
          <Text style={highlightLabel}>Datum & tijd</Text>
          <Text style={highlightValue}>
            {appointmentDate} om {appointmentTime}
          </Text>
        </HighlightBox>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Klantgegevens</Text>

        <Text style={typography.label}>Naam</Text>
        <Text style={typography.value}>{customerName}</Text>

        <Text style={typography.label}>E-mail</Text>
        <Text style={typography.value}>
          <Link href={`mailto:${customerEmail}`} style={components.link}>
            {customerEmail}
          </Link>
        </Text>

        <Text style={typography.label}>Telefoon</Text>
        <Text style={typography.value}>
          <Link href={`tel:${customerPhone}`} style={components.link}>
            {customerPhone}
          </Link>
        </Text>

        <Text style={typography.label}>Adres</Text>
        <Text style={typography.value}>
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customerStreet}, ${customerPostalCode} ${customerCity}`)}`}
            style={components.link}
          >
            {customerStreet}
            <br />
            {customerPostalCode} {customerCity}
          </Link>
        </Text>

        {remarks && (
          <>
            <Hr style={layout.divider} />
            <Text style={typography.label}>Opmerkingen</Text>
            <MessageBox>{remarks}</MessageBox>
          </>
        )}

        <Hr style={layout.divider} />

        <Text style={footerNote}>
          Een .ics bestand is bijgevoegd om de afspraak aan je agenda toe te
          voegen.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default AppointmentAdminNotification;

const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: colors.primary,
  margin: "0 0 16px 0",
};

const highlightLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: colors.primary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
  opacity: 0.7,
};

const highlightValue = {
  fontSize: "20px",
  color: colors.primary,
  margin: "0",
  fontWeight: "600" as const,
};

const footerNote = {
  fontSize: "14px",
  color: colors.muted,
  margin: "0",
  fontStyle: "italic" as const,
};
