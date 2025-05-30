import Link from "next/link";
import { client } from "@/sanity/client";

type NavLink = {
  title: string;
  slug: string;
};

type Navigation = {
  links: NavLink[];
};

const NAV_QUERY = `*[_type == "navigation"][0]{links}`;

export default async function Header() {
  const nav: Navigation = await client.fetch(NAV_QUERY);

  return (
    <header className="w-full py-6 flex items-center justify-between border-b">
      <div className="font-bold text-xl">Assymo</div>
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
