import { client } from "@/sanity/client";
import Link from "next/link";
import NavLinks from "./NavLinks";
import Logo from "./Logo";

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

export default async function Header() {
  const [nav, solutions] = await Promise.all([
    client.fetch(NAV_QUERY),
    client.fetch(SOLUTIONS_QUERY),
  ]);

  return (
    <header className="md:sticky md:top-0 z-50 c-header py-6 w-full">
      <div className="o-grid grid-cols-subgrid">
        <div className="col-span-full flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-8">
          <div className="flex flex-row items-center justify-between gap-4 md:gap-8">
            <Link href="/">
              <Logo className="w-28" />
            </Link>
            <nav className="text-base">
              <NavLinks links={nav?.links || []} solutions={solutions} />
            </nav>
          </div>
          <Link href="/contact" className="c-action w-fit">
            Maak een afspraak
          </Link>
        </div>
      </div>
    </header>
  );
}
