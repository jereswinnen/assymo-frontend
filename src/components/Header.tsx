import { client } from "@/sanity/client";
import Link from "next/link";
import NavLinks from "./NavLinks";

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
      className={`pt-10 flex items-center gap-8 ${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="font-semibold">
        <Link href="/">Assymo</Link>
      </div>
      <div className="w-full flex items-center justify-between">
        <nav>
          <NavLinks links={nav?.links || []} solutions={solutions} />
        </nav>
        <Link href="/contact" className="c-action">
          Maak een afspraak
        </Link>
      </div>
    </header>
  );
}
