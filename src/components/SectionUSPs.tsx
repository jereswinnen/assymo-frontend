import Link from "next/link";
import React from "react";

const usps = [
  {
    icon: "/images/uspDuurzaamIcon.svg",
    title: "Duurzame materialen",
    subtitle:
      "Wij gebruiken alleen hoogwaardige en duurzame materialen voor de bouw van onze projecten, waardoor ze bestand zijn tegen alle weersomstandigheden.",
  },
  {
    icon: "/images/uspMaatwerkIcon.svg",
    title: "Maatwerk ontwerpen",
    subtitle:
      "Onze projecten worden op maat ontworpen en gebouwd volgens de specifieke wensen en behoeften van onze klanten, waardoor elk project uniek is.",
  },
  {
    icon: "/images/uspVakmanschapIcon.svg",
    title: "Vakmanschap",
    subtitle:
      "Ons team van ervaren vakmensen staat garant voor vakmanschap en precisie bij het realiseren van projecten, wat resulteert in hoogwaardige en esthetisch aantrekkelijke resultaten.",
  },
];

export default function SectionUSPs() {
  return (
    <section className="px-container-sm md:px-container-md col-span-full md:col-start-2 md:col-span-6 grid grid-cols-subgrid gap-y-5">
      <header className="col-span-full flex justify-center">
        <h2>Wat maakt Assymo zo goed?</h2>
      </header>
      <section className="col-span-full grid grid-cols-subgrid items-center gap-y-8 md:gap-y-0">
        <div className="col-span-full md:col-span-2">
          <img
            src="/images/sectionUSPImage.jpg"
            alt="Onze voordelen"
            className="max-h-[280px] md:max-h-none w-full md:w-auto rounded-xl object-cover"
          />
        </div>
        <div className="col-span-full md:col-span-4 flex flex-col gap-10">
          <ul className="flex flex-col gap-10">
            {usps.map((usp, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <img
                  src={usp.icon}
                  alt={usp.title}
                  className="w-12 h-12 object-contain flex-shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <h3 className="!mb-0">{usp.title}</h3>
                  <p className="text-lg">{usp.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/oplossingen" className="c-action w-fit">
            Bekijk onze oplossingen
          </Link>
        </div>
      </section>
    </section>
  );
}
