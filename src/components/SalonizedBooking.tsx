"use client";

import { useEffect, useRef } from "react";

interface SalonizedBookingProps {
  className?: string;
}

export default function SalonizedBooking({ className }: SalonizedBookingProps) {
  const scriptAddedRef = useRef(false);

  useEffect(() => {
    if (scriptAddedRef.current) return;
    if (typeof window === "undefined") return;

    const existing = document.querySelector(
      'script[src="https://static-widget.salonized.com/loader.js"]',
    );
    if (existing) {
      scriptAddedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://static-widget.salonized.com/loader.js";
    script.async = true;
    document.body.appendChild(script);
    scriptAddedRef.current = true;

    return () => {
      // keep script loaded globally; no cleanup
    };
  }, []);

  return (
    <div
      className={className}
      data-company="aC9yWcyyPkE3ZwF1D8m8pyzG"
      data-color="#6966ff"
      data-language="nl"
      data-height="700"
      data-inline="true"
      data-outline="shadow"
    />
  );
}
