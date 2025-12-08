import { client } from "@/sanity/client";
import { sectionsFragment } from "@/sanity/fragments";
import SectionRenderer from "@/components/SectionRenderer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  CalendarIcon,
  HomeIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";
import Map from "@/components/Map";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Afspraak ingepland - Assymo",
  description: "Uw afspraak is succesvol ingepland.",
};

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "afspraak/ingepland"
][0]{
  _id,
  title,
  body,
  headerImage,
  ${sectionsFragment}
}`;

const PARAMETERS_QUERY = `*[_type == "siteParameters"][0]{
  address,
  phone,
  email,
}`;

type SiteSettings = {
  address?: string;
  phone?: string;
  email?: string;
};

export default async function AppointmentConfirmedPage() {
  const [page, settings] = await Promise.all([
    client.fetch(PAGE_QUERY),
    client.fetch<SiteSettings>(PARAMETERS_QUERY),
  ]);

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      {page?.sections && page.sections.length > 0 && (
        <SectionRenderer
          sections={page.sections}
          headerImage={page.headerImage}
        />
      )}

      <section className="col-span-full grid grid-cols-subgrid gap-y-14">
        <div className="col-span-full md:col-span-6 flex flex-col gap-6">
          <div>
            APPOINTMENT DETAILS (date/hour/email of user who made appointment)
          </div>
          <div>
            two Action buttons (primary is ics file download and second is back
            to homepage
          </div>
        </div>

        <div className="col-span-full md:col-span-3 flex flex-col gap-6">
          <Map className="max-h-[360px]" />

          <div className="flex flex-col gap-6">
            <Link href="/">
              <Logo className="w-28 text-stone-900" />
            </Link>

            <ul className="flex flex-col gap-3 text-base font-medium">
              {settings?.address && (
                <li className="whitespace-pre-line">{settings.address}</li>
              )}
              {settings?.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
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
                    className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                  >
                    <MailIcon className="size-4" />
                    <span>{settings.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
}
