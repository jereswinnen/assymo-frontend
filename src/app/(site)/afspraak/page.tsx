import { client } from "@/sanity/client";
import { sectionsFragment } from "@/sanity/fragments";
import SectionRenderer from "@/components/SectionRenderer";
import { AppointmentBookingForm } from "@/components/appointments/AppointmentBookingForm";
import Link from "next/link";
import { MailIcon, PhoneIcon } from "lucide-react";
import Map from "@/components/Map";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Maak een afspraak - Assymo",
  description: "",
};

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "afspraak"
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

export default async function AppointmentPage() {
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
        <AppointmentBookingForm className="col-span-full md:col-span-6" />

        <section className="col-span-full md:col-span-3 flex flex-col gap-6">
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
        </section>
      </section>
    </section>
  );
}
