import { Text } from "@react-email/components";
import * as React from "react";
import { components } from "./styles";

interface MessageBoxProps {
  children: React.ReactNode;
}

export function MessageBox({ children }: MessageBoxProps) {
  return <Text style={components.messageBox}>{children}</Text>;
}
