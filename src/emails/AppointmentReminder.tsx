import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import {
  InfoBox,
  InfoRow,
  EmailButton,
  typography,
  layout,
  colors,
  components,
} from "@/components/email";

interface AppointmentReminderProps {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  storeAddress: string;
  editUrl: string;
}

export function AppointmentReminder({
  customerName,
  appointmentDate,
  appointmentTime,
  storeAddress,
  editUrl,
}: AppointmentReminderProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;

  return (
    <EmailLayout preview={`Herinnering: uw afspraak bij Assymo op ${appointmentDate}`}>
      <Section style={layout.content}>
        <Text style={typography.heading}>Herinnering afspraak</Text>
        <Text style={typography.subheading}>Morgen verwachten we u</Text>

        <Hr style={layout.divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={typography.paragraph}>
          Dit is een vriendelijke herinnering dat u morgen een afspraak heeft
          bij Assymo. We kijken ernaar uit u te ontvangen!
        </Text>

        <InfoBox>
          <InfoRow label="Datum" value={appointmentDate} />
          <InfoRow label="Tijdstip" value={appointmentTime} />
          <InfoRow
            label="Locatie"
            value={
              <Link href={mapsUrl} style={components.link}>
                {storeAddress}
              </Link>
            }
          />
        </InfoBox>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Kunt u niet komen of wilt u de afspraak wijzigen? Gebruik dan
          onderstaande knop:
        </Text>

        <EmailButton href={editUrl}>Afspraak beheren</EmailButton>

        <Text style={smallText}>
          Of kopieer deze link naar uw browser:{" "}
          <span style={linkText}>{editUrl}</span>
        </Text>

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

export default AppointmentReminder;

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
