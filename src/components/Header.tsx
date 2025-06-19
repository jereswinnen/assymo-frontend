import { client } from "@/sanity/client";
import Link from "next/link";

type NavLink = {
  title: string;
  slug: string;
};

type Navigation = {
  links: NavLink[];
};

const NAV_QUERY = `*[_type == "navigation"][0]{links}`;

type HeaderProps = {
  className?: string;
};

export default async function Header({ className }: HeaderProps = {}) {
  const nav: Navigation = await client.fetch(NAV_QUERY);

  return (
    <header
      className={`py-6 flex items-center justify-between ${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="font-bold text-xl">
        <Link href="/">Assymo</Link>
      </div>
      <nav>
        <ul className="flex gap-6">
          {(nav?.links || []).map((link: NavLink) => (
            <li key={link.slug}>
              <Link href={`/${link.slug}`}>{link.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
