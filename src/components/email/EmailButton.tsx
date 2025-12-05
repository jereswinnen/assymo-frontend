import { Section, Button } from "@react-email/components";
import * as React from "react";
import { components, layout } from "./styles";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Section style={layout.buttonContainer}>
      <Button style={components.button} href={href}>
        {children}
      </Button>
    </Section>
  );
}
