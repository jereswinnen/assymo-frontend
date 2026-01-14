import { getSiteParameters } from "@/lib/content";
import { AppointmentView } from "./AppointmentView";
import Link from "next/link";
import { MailIcon, PhoneIcon } from "lucide-react";
import Map from "@/components/shared/Map";
import Logo from "@/components/layout/Logo";
import { buildMetadata } from "@/lib/getPageMetadata";

export const metadata = buildMetadata({
  title: "Uw afspraak",
  description: "Bekijk, wijzig of annuleer uw afspraak.",
  path: "/afspraak",
});

interface AppointmentTokenPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function AppointmentTokenPage({
  params,
  searchParams,
}: AppointmentTokenPageProps) {
  const [{ token }, { status }, settings] = await Promise.all([
    params,
    searchParams,
    getSiteParameters(),
  ]);

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      <AppointmentView
        className="col-span-full md:col-span-6"
        token={token}
        initialStatus={status}
      />

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
  );
}
