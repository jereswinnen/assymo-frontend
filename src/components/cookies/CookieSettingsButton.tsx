"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export function CookieSettingsButton() {
  const { resetConsent } = useCookieConsent();

  return (
    <button
      onClick={resetConsent}
      className="cursor-pointer transition-all duration-200 hover:text-zinc-700"
    >
      Cookie-instellingen
    </button>
  );
}
