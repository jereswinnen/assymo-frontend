import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import {
  InfoBox,
  EmailButton,
  typography,
  layout,
  colors,
  components,
} from "@/components/email";

interface AppointmentUpdatedProps {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  storeAddress: string;
  previousDate?: string;
  previousTime?: string;
  editUrl: string;
}

export function AppointmentUpdated({
  customerName,
  appointmentDate,
  appointmentTime,
  storeAddress,
  previousDate,
  previousTime,
  editUrl,
}: AppointmentUpdatedProps) {
  const dateChanged = previousDate && previousDate !== appointmentDate;
  const timeChanged = previousTime && previousTime !== appointmentTime;
  const hasChanges = dateChanged || timeChanged;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;

  return (
    <EmailLayout preview={`Uw afspraak bij Assymo is gewijzigd`}>
      <Section style={layout.content}>
        <Text style={typography.heading}>Afspraak gewijzigd</Text>
        <Text style={typography.subheading}>
          Uw afspraak is succesvol aangepast
        </Text>

        <Hr style={layout.divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={typography.paragraph}>
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

        <InfoBox>
          <Text style={infoBoxTitle}>Nieuwe afspraak</Text>
          <Text style={typography.label}>Datum</Text>
          <Text style={typography.value}>{appointmentDate}</Text>
          <Text style={typography.label}>Tijdstip</Text>
          <Text style={typography.value}>{appointmentTime}</Text>
          <Text style={typography.label}>Locatie</Text>
          <Text style={typography.value}>
            <Link href={mapsUrl} style={components.link}>
              {storeAddress}
            </Link>
          </Text>
        </InfoBox>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Wilt u uw afspraak nogmaals wijzigen? Klik dan op onderstaande knop:
        </Text>

        <EmailButton href={editUrl}>Afspraak beheren</EmailButton>

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

export default AppointmentUpdated;

const greeting = {
  fontSize: "16px",
  color: colors.primary,
  margin: "0 0 16px 0",
  fontWeight: "600" as const,
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
  color: colors.primary,
  margin: "4px 0",
};

const oldValue = {
  textDecoration: "line-through" as const,
  color: colors.muted,
};

const newValue = {
  fontWeight: "600" as const,
  color: colors.primary,
};

const infoBoxTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: colors.primary,
  margin: "0 0 16px 0",
  paddingBottom: "12px",
  borderBottom: `1px solid ${colors.border}`,
};

