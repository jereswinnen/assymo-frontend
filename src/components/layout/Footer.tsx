import Link from "next/link";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { getNavigation, getSiteParameters } from "@/lib/content";
import { PhoneIcon, InstagramIcon, FacebookIcon, MailIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { NewsletterForm } from "../forms/NewsletterForm";

type SubItem = {
  name: string;
  slug: string;
};

type NavLink = {
  title: string;
  slug: string;
  subItems?: SubItem[];
};

interface FooterProps {
  className?: string;
}

export default async function Footer({ className }: FooterProps) {
  const [navLinks, settings] = await Promise.all([
    getNavigation("header"),
    getSiteParameters(),
  ]);

  // Transform navigation links to match expected format
  const links: NavLink[] = navLinks.map((link) => ({
    title: link.title,
    slug: link.slug,
    subItems: link.sub_items
      ?.filter((item) => item.solution)
      .map((item) => ({
        name: item.solution!.name,
        slug: item.solution!.slug,
      })),
  }));

  return (
    <footer className={cn("py-10 md:py-14 bg-zinc-100", className)}>
      <div className="o-grid gap-y-8! *:col-span-full">
        <div className="flex justify-end">
          <NewsletterForm className="basis-full md:basis-[65%]" />
        </div>

        <Separator className="bg-zinc-200" />

        <div className="flex flex-col gap-12 md:gap-0 md:flex-row md:justify-between">
          <div className="flex flex-col gap-6 order-last md:order-first basis-full md:basis-[35%]">
            <Link href="/">
              <Logo className="w-28 text-zinc-900" />
            </Link>

            <ul className="flex flex-col gap-3 text-base font-medium">
              {settings?.address && (
                <li
                  className="[&_p]:mb-0! [&_p+p]:mt-0.5 [&_a]:underline [&_a]:hover:text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: settings.address }}
                />
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

            {(settings?.instagram || settings?.facebook) && (
              <>
                <Separator className="md:max-w-[60%]!" />
                <ul className="flex gap-3 *:text-zinc-500 *:transition-colors *:duration-300 *:hover:text-zinc-700">
                  {settings?.instagram && (
                    <li>
                      <Link
                        href={settings.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <InstagramIcon className="size-5" />
                      </Link>
                    </li>
                  )}
                  {settings?.facebook && (
                    <li>
                      <Link
                        href={settings.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FacebookIcon className="size-5" />
                      </Link>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>

          <nav className="flex flex-col md:flex-row gap-8 justify-between basis-full md:basis-[65%]">
            {links.map((link) => (
              <div key={link.slug} className="flex flex-col gap-3">
                <Link
                  href={`/${link.slug}`}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-800 transition-colors duration-300"
                >
                  {link.title}
                </Link>
                {link.subItems && link.subItems.length > 0 && (
                  <ul className="flex flex-col gap-0.5">
                    {link.subItems.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/realisaties/${item.slug}`}
                          className="text-lg font-medium text-zinc-800 hover:text-zinc-600 transition-colors duration-300"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex justify-end">
          <nav className="basis-full md:basis-[65%] text-xs font-medium text-zinc-500">
            <ul className="flex items-center gap-3 flex-wrap">
              <li>
                <Link
                  href="/privacy"
                  className="transition-all duration-200 hover:text-zinc-700"
                >
                  Privacy Policy
                </Link>
              </li>
              {/*<Separator orientation="vertical" className="h-3! bg-zinc-300" />
              <li>
                <CookieSettingsButton />
              </li>*/}
              <Separator orientation="vertical" className="h-3! bg-zinc-300" />
              {settings?.vat_number && (
                <li className="mb-0!">{settings.vat_number}</li>
              )}
              {settings?.vat_number && (
                <Separator
                  orientation="vertical"
                  className="h-3! bg-zinc-300"
                />
              )}
              <li>&copy; {new Date().getFullYear()} Assymo</li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
