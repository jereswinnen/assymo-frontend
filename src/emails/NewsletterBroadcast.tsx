import {
  Section,
  Text,
  Hr,
  Img,
  Button,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import type { NewsletterSection } from "@/config/newsletter";

interface NewsletterBroadcastProps {
  preheader?: string;
  sections: NewsletterSection[];
}

export function NewsletterBroadcast({
  preheader,
  sections,
}: NewsletterBroadcastProps) {
  return (
    <EmailLayout preview={preheader || "Nieuwsbrief van Assymo"}>
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <Section style={sectionStyle}>
            {section.imageUrl && (
              <Img
                src={section.imageUrl}
                alt={section.title}
                style={imageStyle}
              />
            )}

            <Heading as="h2" style={headingStyle}>
              {section.title}
            </Heading>

            <Text style={textStyle}>{section.text}</Text>

            {section.ctaUrl && section.ctaText && (
              <Button href={section.ctaUrl} style={buttonStyle}>
                {section.ctaText}
              </Button>
            )}
          </Section>

          {index < sections.length - 1 && <Hr style={dividerStyle} />}
        </React.Fragment>
      ))}

      <Hr style={dividerStyle} />

      <Section style={footerSection}>
        <Text style={footerText}>
          Je ontvangt deze e-mail omdat je je hebt ingeschreven voor de Assymo
          nieuwsbrief.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default NewsletterBroadcast;

const sectionStyle = {
  padding: "32px 48px",
};

const imageStyle = {
  width: "100%",
  maxWidth: "100%",
  borderRadius: "8px",
  marginBottom: "24px",
};

const headingStyle = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#1f3632",
  margin: "0 0 16px 0",
};

const textStyle = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525f7f",
  margin: "0 0 24px 0",
};

const buttonStyle = {
  backgroundColor: "#1f3632",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontWeight: "600" as const,
  fontSize: "14px",
  textDecoration: "none",
};

const dividerStyle = {
  borderColor: "#e6ebf1",
  margin: "0",
};

const footerSection = {
  padding: "24px 48px",
};

const footerText = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "0",
};
