import { getPageBySlug, getSiteParameters } from "@/lib/content";
import SectionRenderer from "@/components/shared/SectionRenderer";
import { BookingForm } from "@/components/appointments/BookingForm";
import Link from "next/link";
import { MailIcon, PhoneIcon } from "lucide-react";
import Map from "@/components/shared/Map";
import Logo from "@/components/layout/Logo";

export const metadata = {
  title: "Maak een afspraak - Assymo",
  description: "Breng een bezoekje aan onze toonzaal.",
};

export default async function AppointmentPage() {
  const [page, settings] = await Promise.all([
    getPageBySlug("afspraak"),
    getSiteParameters(),
  ]);

  const sections = (page?.sections || []) as any[];
  const headerImage = page?.header_image as any;

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      {sections.length > 0 && (
        <SectionRenderer sections={sections} headerImage={headerImage} />
      )}
      <section className="col-span-full grid grid-cols-subgrid gap-y-14">
        <BookingForm className="col-span-full md:col-span-6" />

        <section className="col-span-full md:col-span-3 flex flex-col gap-6">
          <Map className="max-h-[360px]" />

          <div className="flex flex-col gap-6">
            <Link href="/">
              <Logo className="w-28 text-zinc-900" />
            </Link>

            <ul className="flex flex-col gap-3 text-base font-medium">
              {settings?.address && (
                <li className="whitespace-pre-line">{settings.address}</li>
              )}
              {settings?.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 transition-colors duration-300"
                  >
                    <PhoneIcon className="size-4" />
                    <span>{settings.phone}</span>
                  </a>
                </li>
              )}
              {settings?.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 transition-colors duration-300"
                  >
                    <MailIcon className="size-4" />
                    <span>{settings.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </section>
      </section>
    </section>
  );
}
