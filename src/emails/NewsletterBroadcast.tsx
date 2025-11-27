import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface NewsletterBroadcastProps {
  subject: string;
  content: string;
}

export function NewsletterBroadcast({
  subject,
  content,
}: NewsletterBroadcastProps) {
  return (
    <EmailLayout preview={subject}>
      <Section style={contentStyle}>
        <Text style={heading}>{subject}</Text>

        <Hr style={divider} />

        <div
          style={bodyContent}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <Hr style={divider} />

        <Text style={smallText}>
          Je ontvangt deze e-mail omdat je je hebt ingeschreven voor de Assymo
          nieuwsbrief. Wil je geen e-mails meer ontvangen? Klik dan op
          uitschrijven.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default NewsletterBroadcast;

const contentStyle = {
  padding: "32px 48px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1f3632",
  margin: "0 0 24px 0",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const bodyContent = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
};

const smallText = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "0",
};
