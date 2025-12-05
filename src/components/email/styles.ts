/**
 * Shared email styles for consistent appearance across all email templates.
 * These are inline styles required for email client compatibility.
 */

// Brand colors
export const colors = {
  primary: "#1f3632",
  accent: "#22df90",
  muted: "#8898aa",
  text: "#525f7f",
  background: "#f6f9fc",
  border: "#e6ebf1",
  white: "#ffffff",
} as const;

// Typography
export const typography = {
  heading: {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: colors.primary,
    margin: "0 0 8px 0",
  },
  subheading: {
    fontSize: "14px",
    color: colors.muted,
    margin: "0 0 24px 0",
  },
  paragraph: {
    fontSize: "16px",
    color: colors.primary,
    margin: "0 0 16px 0",
    lineHeight: "1.5",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600" as const,
    color: colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 4px 0",
  },
  value: {
    fontSize: "16px",
    color: colors.primary,
    margin: "0 0 16px 0",
  },
  small: {
    fontSize: "12px",
    color: colors.muted,
    margin: "0",
  },
  signature: {
    fontSize: "16px",
    color: colors.primary,
    margin: "24px 0 0 0",
    lineHeight: "1.5",
  },
} as const;

// Layout
export const layout = {
  content: {
    padding: "32px 48px",
  },
  divider: {
    borderColor: colors.border,
    margin: "24px 0",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "24px 0",
  },
} as const;

// Components
export const components = {
  // Matches the primary Action button style from src/components/Action.tsx
  button: {
    backgroundColor: colors.primary,
    borderRadius: "9999px", // rounded-full (pill shape)
    color: colors.accent, // text-accent-light
    fontSize: "14px", // text-sm
    fontWeight: "500" as const, // font-medium
    textDecoration: "none",
    textAlign: "center" as const,
    padding: "8px 14px", // py-2 px-3.5
  },
  infoBox: {
    backgroundColor: colors.background,
    padding: "24px",
    borderRadius: "8px",
    margin: "16px 0",
  },
  highlightBox: {
    backgroundColor: colors.accent,
    padding: "24px",
    borderRadius: "8px",
    margin: "0",
  },
  messageBox: {
    fontSize: "16px",
    color: colors.primary,
    margin: "0",
    whiteSpace: "pre-wrap" as const,
    backgroundColor: colors.background,
    padding: "16px",
    borderRadius: "4px",
  },
} as const;
