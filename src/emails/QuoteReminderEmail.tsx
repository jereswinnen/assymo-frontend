import { Section, Text, Hr, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import {
  HighlightBox,
  EmailButton,
  typography,
  layout,
  colors,
  components,
} from "@/components/email";

interface QuoteReminderEmailProps {
  customerName: string;
  productName: string;
  priceEstimate: string;
}

export function QuoteReminderEmail({
  customerName,
  productName,
  priceEstimate,
}: QuoteReminderEmailProps) {
  const bookingUrl = "https://assymo.be/afspraak";

  return (
    <EmailLayout
      preview={`Herinnering: uw offerte aanvraag voor ${productName}`}
    >
      <Section style={layout.content}>
        <Text style={typography.heading}>Herinnering offerte</Text>
        <Text style={typography.subheading}>Nog geen afspraak ingepland?</Text>

        <Hr style={layout.divider} />

        <Text style={greeting}>Beste {customerName},</Text>

        <Text style={typography.paragraph}>
          Een paar dagen geleden vroeg u een offerte aan voor een {productName}.
          We zagen dat u nog geen afspraak heeft ingepland voor een vrijblijvend
          gesprek in onze toonzaal.
        </Text>

        {/* Price Reminder */}
        <HighlightBox>
          <Text style={highlightLabel}>Uw prijsindicatie</Text>
          <Text style={highlightValue}>{priceEstimate}</Text>
        </HighlightBox>

        <Hr style={layout.divider} />

        <Text style={sectionTitle}>Waarom een afspraak?</Text>
        <Text style={typography.paragraph}>
          Tijdens een gesprek in onze toonzaal overlopen we uw project en
          bespreken we uw wensen. Zo kunnen we u een nauwkeurige offerte
          bezorgen die perfect aansluit bij uw situatie.
        </Text>

        <EmailButton href={bookingUrl}>Afspraak inplannen</EmailButton>

        <Hr style={layout.divider} />

        <Text style={typography.paragraph}>
          Heeft u vragen of wilt u liever telefonisch een afspraak maken? Neem
          gerust contact met ons op via{" "}
          <Link href="mailto:info@assymo.be" style={components.link}>
            info@assymo.be
          </Link>{" "}
          of bel naar{" "}
          <Link href="tel:+32474299889" style={components.link}>
            +32 474 29 98 89
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

export default QuoteReminderEmail;

// =============================================================================
// Styles
// =============================================================================

const greeting = {
  fontSize: "16px",
  color: colors.primary,
  margin: "0 0 16px 0",
  fontWeight: "600" as const,
};

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
  fontSize: "24px",
  color: colors.primary,
  margin: "0",
  fontWeight: "600" as const,
};
