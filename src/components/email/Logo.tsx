import { Img } from "@react-email/components";
import * as React from "react";

/**
 * Email logo using a hosted PNG image for maximum email client compatibility.
 * SVG is NOT reliably supported - Outlook desktop strips it entirely.
 *
 * The logo is hosted on assymo.be for reliability.
 * Image dimensions: 240x74 (2x retina, displayed at 120x37)
 */
export function EmailLogo() {
  return (
    <Img
      src="https://assymo.be/images/assymoLogoEmail.png"
      alt="Assymo"
      width={120}
      height={37}
      style={{
        display: "block",
        outline: "none",
        border: "none",
        textDecoration: "none",
      }}
    />
  );
}
