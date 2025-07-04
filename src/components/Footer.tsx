import Image from "next/image";
import NavLinks from "./NavLinks";
import { client } from "@/sanity/client";
import Link from "next/link";

type FooterProps = {
  className?: string;
};

const NAV_QUERY = `*[_type == "navigation"][0]{links}`;

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc) {
  _id,
  name,
  slug
}`;

export default async function Footer({ className }: FooterProps = {}) {
  const [nav, solutions] = await Promise.all([
    client.fetch(NAV_QUERY),
    client.fetch(SOLUTIONS_QUERY),
  ]);

  return (
    <footer
      className={`py-12 grid grid-cols-subgrid border-t-2 border-(--c-accent-dark)/10 ${className ? ` ${className}` : ""}`}
    >
      <div className="col-span-full grid grid-cols-subgrid">
        <NavLinks
          className="col-span-6"
          links={nav?.links || []}
          solutions={solutions}
        />
        <aside className="col-span-2">
          <ul className="w-full flex flex-col items-end [&>*]:w-full [&>*]:flex [&>*]:flex-col [&>*]:items-end [&>*]:gap-1.5 text-base divide-y divide-(--c-accent-dark)/10">
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
              <li className="pt-3">
                <Link href="/contact" className="c-action">
                  Maak een afspraak
                </Link>
              </li>
            </ul>
          </ul>
        </aside>
      </div>

      <div className="col-span-full">
        <Image
          src="/assymoBrandFooter.svg"
          alt="Assymo Brand"
          width={1920}
          height={100}
          className="w-full"
        />
      </div>

      <div className="col-span-full text-sm">
        &copy; {new Date().getFullYear()} Assymo. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}
