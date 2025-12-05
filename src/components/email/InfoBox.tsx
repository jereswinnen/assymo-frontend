import { Section, Text } from "@react-email/components";
import * as React from "react";
import { components, typography } from "./styles";

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <>
      <Text style={typography.label}>{label}</Text>
      <Text style={typography.value}>{value}</Text>
    </>
  );
}

interface InfoBoxProps {
  children: React.ReactNode;
}

export function InfoBox({ children }: InfoBoxProps) {
  return <Section style={components.infoBox}>{children}</Section>;
}
