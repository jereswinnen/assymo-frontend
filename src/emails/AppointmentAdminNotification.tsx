import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface AppointmentAdminNotificationProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerStreet: string;
  customerPostalCode: string;
  customerCity: string;
  appointmentDate: string; // Formatted Dutch date
  appointmentTime: string; // e.g., "14:00 uur"
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
    <EmailLayout preview={`Nieuwe afspraak: ${customerName} op ${appointmentDate}`}>
      <Section style={content}>
        <Text style={heading}>Nieuwe afspraak</Text>
        <Text style={subheading}>Er is een nieuwe afspraak ingepland</Text>

        <Hr style={divider} />

        <Section style={appointmentBox}>
          <Text style={appointmentLabel}>Datum & tijd</Text>
          <Text style={appointmentValue}>
            {appointmentDate} om {appointmentTime}
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={sectionTitle}>Klantgegevens</Text>

        <Text style={label}>Naam</Text>
        <Text style={value}>{customerName}</Text>

        <Text style={label}>E-mail</Text>
        <Text style={value}>{customerEmail}</Text>

        <Text style={label}>Telefoon</Text>
        <Text style={value}>{customerPhone}</Text>

        <Text style={label}>Adres</Text>
        <Text style={value}>
          {customerStreet}
          <br />
          {customerPostalCode} {customerCity}
        </Text>

        {remarks && (
          <>
            <Hr style={divider} />
            <Text style={label}>Opmerkingen</Text>
            <Text style={remarksStyle}>{remarks}</Text>
          </>
        )}

        <Hr style={divider} />

        <Text style={footerNote}>
          Een .ics bestand is bijgevoegd om de afspraak aan je agenda toe te
          voegen.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default AppointmentAdminNotification;

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

const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1f3632",
  margin: "0 0 16px 0",
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

const appointmentBox = {
  backgroundColor: "#22df90",
  padding: "24px",
  borderRadius: "8px",
  margin: "0",
};

const appointmentLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#1f3632",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
  opacity: 0.7,
};

const appointmentValue = {
  fontSize: "20px",
  color: "#1f3632",
  margin: "0",
  fontWeight: "600" as const,
};

const remarksStyle = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
  backgroundColor: "#f6f9fc",
  padding: "16px",
  borderRadius: "4px",
};

const footerNote = {
  fontSize: "14px",
  color: "#8898aa",
  margin: "0",
  fontStyle: "italic" as const,
};
