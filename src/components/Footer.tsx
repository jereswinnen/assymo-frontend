import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export default async function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("c-footer py-6 w-full", className)}>
      <div className="o-grid grid-cols-subgrid !gap-y-8 md:gap-y-0">
        <Link href="/" className="col-span-full md:col-span-2">
          <Logo className="w-38" />
        </Link>
        <aside className="col-span-full md:col-span-2">
          <ul className="w-full flex flex-col [&>*]:w-full [&>*]:flex [&>*]:flex-col [&>*]:gap-1.5 text-base divide-y divide-(--c-accent-dark)/10">
            <ul className="pb-2 mb-2">
              <li>Eikenlei 159</li>
              <li>2960 Brecht</li>
            </ul>
            <ul className="pb-2 mb-2">
              <li>
                <Link href="mailto:info@assymo.be" className="hover:underline">
                  info@assymo.be
                </Link>
              </li>
              <li>
                <Link href="tel:+32123456789" className="hover:underline">
                  +32 3 434 74 98
                </Link>
              </li>
            </ul>
          </ul>
        </aside>

        <div className="col-span-full md:col-span-2 grid items-center">
          <Link href="/contact" className="c-action w-fit h-fit">
            Maak een afspraak
          </Link>
        </div>

        <div className="col-span-full md:col-span-2 grid">
          <ul className="flex items-center gap-4">
            <li>
              <Link
                href="https://instagram.com/assymo_tuinconstructies/"
                className="block"
              >
                <Image
                  src="/socialIconInstagram.svg"
                  alt="Instagram"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </Link>
            </li>
            <li>
              <Link
                href="https://facebook.com/Assymo.Tuinconstructies.Op.Maat"
                className="block"
              >
                <Image
                  src="/socialIconFacebook.svg"
                  alt="Facebook"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </Link>
            </li>
          </ul>
        </div>

        <div className="hidden col-span-full md:col-span-full text-sm">
          &copy; {new Date().getFullYear()} Assymo. Alle rechten voorbehouden.
        </div>
      </div>
    </footer>
  );
}
