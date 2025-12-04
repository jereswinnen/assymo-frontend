"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CookieBanner() {
  const { showBanner, updateConsent } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50",
        "max-w-sm w-full",
        "bg-white border border-stone-200 rounded-2xl shadow-2xl",
        "p-5",
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-stone-900">
            Wij gebruiken cookies
          </h3>
          <p className="text-sm text-stone-600">
            We gebruiken cookies en lokale opslag om uw ervaring te verbeteren
            en de chatbot te laten werken.{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Privacybeleid
            </Link>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConsent("essential")}
            className="flex-1"
          >
            Alleen essentieel
          </Button>
          <Button
            size="sm"
            onClick={() => updateConsent("all")}
            className="flex-1"
          >
            Alles accepteren
          </Button>
        </div>
      </div>
    </div>
  );
}
