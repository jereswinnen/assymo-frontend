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
      className={`py-6 flex items-center justify-between ${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="font-bold text-xl">
        <Link href="/">Assymo</Link>
      </div>
      <nav>
        <ul className="flex gap-6">
          {(nav?.links || []).map((link: NavLink) => {
            if (link.title === "Oplossingen") {
              return (
                <li key={link.slug} className="relative group">
                  <Link href={`/${link.slug}`}>{link.title}</Link>
                  <ul className="absolute left-0 top-full w-56 bg-white shadow-lg rounded hidden group-hover:block z-10 border border-gray-200">
                    {solutions.map((solution: any) => (
                      <li key={solution._id}>
                        <Link
                          href={`/oplossingen/${solution.slug.current}`}
                          className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                        >
                          {solution.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }
            return (
              <li key={link.slug}>
                <Link href={`/${link.slug}`}>{link.title}</Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
