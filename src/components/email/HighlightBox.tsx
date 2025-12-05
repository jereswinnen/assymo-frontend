import { Section } from "@react-email/components";
import * as React from "react";
import { components } from "./styles";

interface HighlightBoxProps {
  children: React.ReactNode;
}

export function HighlightBox({ children }: HighlightBoxProps) {
  return <Section style={components.highlightBox}>{children}</Section>;
}
