"use client";

import { useState, useEffect, useCallback } from "react";

export type ConsentLevel = "all" | "essential" | null;

interface CookieConsent {
  level: ConsentLevel;
  timestamp: string;
}

const CONSENT_STORAGE_KEY = "cookie_consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentLevel>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed: CookieConsent = JSON.parse(stored);
        setConsent(parsed.level);
      }
    } catch (error) {
      console.error("Failed to load cookie consent:", error);
    }
    setIsLoaded(true);
  }, []);

  const updateConsent = useCallback((level: ConsentLevel) => {
    if (typeof window === "undefined") return;

    try {
      const consentData: CookieConsent = {
        level,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      setConsent(level);
    } catch (error) {
      console.error("Failed to save cookie consent:", error);
    }
  }, []);

  const resetConsent = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      setConsent(null);
    } catch (error) {
      console.error("Failed to reset cookie consent:", error);
    }
  }, []);

  return {
    consent,
    isLoaded,
    showBanner: isLoaded && consent === null,
    hasFullConsent: consent === "all",
    hasEssentialOnly: consent === "essential",
    updateConsent,
    resetConsent,
  };
}

// Standalone function to check consent without hook (for use in non-component code)
export function getStoredConsent(): ConsentLevel {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      const parsed: CookieConsent = JSON.parse(stored);
      return parsed.level;
    }
  } catch (error) {
    console.error("Failed to get stored consent:", error);
  }
  return null;
}

export function hasFullStorageConsent(): boolean {
  return getStoredConsent() === "all";
}
