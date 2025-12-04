import { Section, Text, Hr, Button } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface AppointmentUpdatedProps {
  customerName: string;
  appointmentDate: string; // New formatted Dutch date
  appointmentTime: string; // New time, e.g., "14:00 uur"
  storeLocation: string;
  previousDate?: string; // Old date (if changed)
  previousTime?: string; // Old time (if changed)
  editUrl: string;
}

export function AppointmentUpdated({
  customerName,
  appointmentDate,
  appointmentTime,
  storeLocation,
  previousDate,
  previousTime,
  editUrl,
}: AppointmentUpdatedProps) {
  const dateChanged = previousDate && previousDate !== appointmentDate;
  const timeChanged = previousTime && previousTime !== appointmentTime;
  const hasChanges = dateChanged || timeChanged;

  return (
    <EmailLayout preview={`Uw afspraak bij Assymo is gewijzigd`}>
      <Section style={content}>
        <Text style={heading}>Afspraak gewijzigd</Text>
        <Text style={subheading}>Uw afspraak is succesvol aangepast</Text>

        <Hr style={divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={paragraph}>
          Uw afspraak bij Assymo is gewijzigd. Hieronder vindt u de nieuwe
          details.
        </Text>

        {hasChanges && (
          <Section style={changesBox}>
            <Text style={changesTitle}>Wat is er gewijzigd?</Text>
            {dateChanged && (
              <Text style={changeItem}>
                <span style={oldValue}>{previousDate}</span>
                {" → "}
                <span style={newValue}>{appointmentDate}</span>
              </Text>
            )}
            {timeChanged && (
              <Text style={changeItem}>
                <span style={oldValue}>{previousTime}</span>
                {" → "}
                <span style={newValue}>{appointmentTime}</span>
              </Text>
            )}
          </Section>
        )}

        <Section style={appointmentBox}>
          <Text style={appointmentLabel}>Nieuwe afspraak</Text>

          <Text style={detailLabel}>Datum</Text>
          <Text style={appointmentValue}>{appointmentDate}</Text>

          <Text style={detailLabel}>Tijdstip</Text>
          <Text style={appointmentValue}>{appointmentTime}</Text>

          <Text style={detailLabel}>Locatie</Text>
          <Text style={appointmentValue}>{storeLocation}</Text>
        </Section>

        <Hr style={divider} />

        <Text style={paragraph}>
          Moet u uw afspraak nogmaals wijzigen of annuleren?
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={editUrl}>
            Afspraak beheren
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

export default AppointmentUpdated;

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

const changesBox = {
  backgroundColor: "#fef3c7",
  padding: "16px 24px",
  borderRadius: "8px",
  margin: "16px 0",
};

const changesTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#92400e",
  margin: "0 0 8px 0",
};

const changeItem = {
  fontSize: "14px",
  color: "#1f3632",
  margin: "4px 0",
};

const oldValue = {
  textDecoration: "line-through" as const,
  color: "#8898aa",
};

const newValue = {
  fontWeight: "600" as const,
  color: "#1f3632",
};

const appointmentBox = {
  backgroundColor: "#f6f9fc",
  padding: "24px",
  borderRadius: "8px",
  margin: "16px 0",
};

const appointmentLabel = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#1f3632",
  margin: "0 0 16px 0",
  paddingBottom: "12px",
  borderBottom: "1px solid #e6ebf1",
};

const detailLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#8898aa",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const appointmentValue = {
  fontSize: "16px",
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

const signature = {
  fontSize: "16px",
  color: "#1f3632",
  margin: "24px 0 0 0",
  lineHeight: "1.5",
};
