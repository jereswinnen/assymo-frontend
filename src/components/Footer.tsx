import Link from "next/link";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { client } from "@/sanity/client";
import { PhoneIcon, InstagramIcon, FacebookIcon } from "lucide-react";
import { Separator } from "./ui/separator";
import { NewsletterForm } from "./NewsletterForm";

const NAV_QUERY = `*[_type == "navigation"][0]{
  links[]{
    title,
    slug,
    subItems[]->{
      name,
      slug
    }
  }
}`;

const PARAMETERS_QUERY = `*[_type == "siteParameters"][0]{
  address,
  phone,
  vatNumber,
  instagram,
  facebook
}`;

type SubItem = {
  name: string;
  slug: { current: string };
};

type NavLink = {
  title: string;
  slug: string;
  subItems?: SubItem[];
};

type SiteSettings = {
  address?: string;
  phone?: string;
  vatNumber?: string;
  instagram?: string;
  facebook?: string;
};

interface FooterProps {
  className?: string;
}

export default async function Footer({ className }: FooterProps) {
  const [nav, settings] = await Promise.all([
    client.fetch<{ links: NavLink[] }>(NAV_QUERY),
    client.fetch<SiteSettings>(PARAMETERS_QUERY),
  ]);

  const links = nav?.links || [];

  return (
    <footer className={cn("py-10 md:py-14 bg-stone-100", className)}>
      <div className="o-grid gap-y-8! *:col-span-full">
        <div className="flex justify-end">
          <NewsletterForm className="basis-full md:basis-[65%]" />
        </div>

        <Separator className="bg-stone-200" />

        <div className="flex flex-col gap-12 md:gap-0 md:flex-row md:justify-between">
          <div className="flex flex-col gap-6 order-2 md:order-1 basis-full md:basis-[35%]">
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
            </ul>

            {(settings?.instagram || settings?.facebook) && (
              <>
                <Separator className="md:max-w-[60%]!" />
                <ul className="flex gap-3 *:text-stone-500 *:transition-colors *:duration-300 *:hover:text-stone-700">
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
                  className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors duration-300"
                >
                  {link.title}
                </Link>
                {link.subItems && link.subItems.length > 0 && (
                  <ul className="flex flex-col gap-0.5">
                    {link.subItems.map((item) => (
                      <li key={item.slug.current}>
                        <Link
                          href={`/realisaties/${item.slug.current}`}
                          className="text-lg font-medium text-stone-800 hover:text-stone-600 transition-colors duration-300"
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
          <nav className="basis-full md:basis-[65%] text-xs font-medium text-stone-500">
            <ul className="flex items-center gap-3">
              <Link
                href="#"
                className="transition-all duration-200 hover:text-stone-700"
              >
                Privacy Policy
              </Link>
              <Separator orientation="vertical" className="h-3! bg-stone-300" />
              {settings?.vatNumber && (
                <p className="mb-0!">{settings.vatNumber}</p>
              )}
              <Separator orientation="vertical" className="h-3! bg-stone-300" />
              <p>&copy; {new Date().getFullYear()} Assymo</p>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
