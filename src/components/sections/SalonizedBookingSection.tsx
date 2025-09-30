"use client";

import { useEffect, useRef } from "react";

type Props = { heading?: string };

export default function SalonizedBookingSection({ heading }: Props) {
  const scriptAddedRef = useRef(false);

  useEffect(() => {
    if (scriptAddedRef.current) return;
    if (typeof window === "undefined") return;

    const existing = document.querySelector(
      'script[src="https://static-widget.salonized.com/loader.js"]'
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
    <section className="col-span-full grid grid-cols-subgrid">
      <div className="col-span-full max-w-5xl mx-auto">
        {heading ? <h2 className="mb-6">{heading}</h2> : null}
        <div
          className="salonized-booking"
          data-company="aC9yWcyyPkE3ZwF1D8m8pyzG"
          data-color="#6966ff"
          data-language="nl"
          data-height="700"
          data-inline="true"
          data-outline="shadow"
        />
      </div>
    </section>
  );
}
