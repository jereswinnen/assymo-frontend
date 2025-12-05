import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { colors, EmailLogo } from "@/components/email";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Link href="https://assymo.be">
              <EmailLogo />
            </Link>
          </Section>
          {children}
          <Section style={footer}>
            <Text style={footerText}>
              Assymo - Maatwerk voor binnen en buiten.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: colors.background,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: colors.white,
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  padding: "32px 48px",
  borderBottom: `1px solid ${colors.border}`,
};

const footer = {
  padding: "32px 48px",
  borderTop: `1px solid ${colors.border}`,
};

const footerText = {
  fontSize: "12px",
  color: colors.muted,
  margin: "0",
};
