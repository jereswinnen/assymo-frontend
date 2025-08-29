import { client } from "@/sanity/client";
import Link from "next/link";
import NavLinks from "./NavLinks";
import Image from "next/image";

type NavLink = {
  title: string;
  slug: string;
};

type Navigation = {
  links: NavLink[];
};

const NAV_QUERY = `*[_type == "navigation"][0]{links}`;

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc) {
  _id,
  name,
  slug
}`;

type HeaderProps = {
  className?: string;
};

export default async function Header({ className }: HeaderProps = {}) {
  const [nav, solutions] = await Promise.all([
    client.fetch(NAV_QUERY),
    client.fetch(SOLUTIONS_QUERY),
  ]);

  return (
    <header
      className={`c-header py-10 flex flex-col md:flex-row justify-start md:items-center gap-4 md:gap-8 ${
        className ? ` ${className}` : ""
      }`}
    >
      <Link href="/">
        <Image
          src="/assymoBrandHeader.svg"
          alt="Assymo Brand"
          width={1920}
          height={100}
          className="w-28"
        />
      </Link>
      <div className="w-full flex items-center justify-between">
        <nav className="text-base">
          <NavLinks links={nav?.links || []} solutions={solutions} />
        </nav>
        <Link href="/contact" className="c-action">
          Maak een afspraak
        </Link>
      </div>
    </header>
  );
}
