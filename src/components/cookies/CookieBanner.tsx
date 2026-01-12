"use client";

import { useState } from "react";
import { useCookieConsent, type ConsentLevel } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export default function CookieBanner() {
  const { showBanner, updateConsent } = useCookieConsent();
  const [isExiting, setIsExiting] = useState(false);

  const handleConsent = (level: ConsentLevel) => {
    setIsExiting(true);
    // Wait for exit animation to complete before updating consent
    setTimeout(() => {
      updateConsent(level);
    }, 300);
  };

  return (
    <AnimatePresence>
      {showBanner && !isExiting && (
        <motion.div
          initial={{ y: 16, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 16, opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.4, ease: "easeInOut", delay: 0.5 }}
          className={cn(
            "fixed bottom-4 left-4 z-50",
            "max-w-sm w-full",
            "bg-white rounded-xl border border-black/5 shadow-lg",
            "p-4",
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 *:mb-0!">
              <h3 className="text-zinc-800">Fijn dat je er bent!</h3>
              <p className="text-sm text-zinc-600">
                Op onze website maken we gebruik van cookies voor statistieken
                en om de chatfunctie goed te laten werken. Door op &apos;Alles
                accepteren&apos; te klikken, ga je akkoord met ons{" "}
                <Link href="/privacy" className="font-medium text-zinc-800">
                  privacybeleid
                </Link>
                .
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConsent("essential")}
                className="flex-1"
              >
                Alleen essentieel
              </Button>
              <Button
                size="sm"
                onClick={() => handleConsent("all")}
                className="flex-1"
              >
                Alles accepteren
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
