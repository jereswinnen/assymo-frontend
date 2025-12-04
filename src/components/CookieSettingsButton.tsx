"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export function CookieSettingsButton() {
  const { resetConsent } = useCookieConsent();

  return (
    <button
      onClick={resetConsent}
      className="transition-all duration-200 hover:text-stone-700"
    >
      Cookie-instellingen
    </button>
  );
}
