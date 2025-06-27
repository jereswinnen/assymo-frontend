"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  title: string;
  slug: string;
};

type Solution = {
  _id: string;
  name: string;
  slug: { current: string };
};

type Props = {
  links: NavLink[];
  solutions: Solution[];
  className?: string;
};

export default function NavLinks({ links, solutions, className }: Props) {
  const pathname = usePathname();

  return (
    <ul className={`flex gap-8${className ? ` ${className}` : ""}`}>
      {links.map((link) => {
        const isActive =
          pathname === `/${link.slug}` ||
          (link.slug === "" && pathname === "/");
        if (link.title === "Oplossingen") {
          // Check if any solution is active
          const isSolutionActive = pathname.startsWith("/oplossingen/");
          return (
            <li key={link.slug} className="relative group">
              <Link
                href={`/${link.slug}`}
                className={`font-medium${isSolutionActive ? " text-primary font-bold" : ""}`}
              >
                {link.title}
              </Link>
              <ul className="absolute left-0 top-full w-56 bg-white shadow-lg rounded invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-300 z-10 border border-gray-200">
                {solutions.map((solution) => {
                  const solutionActive =
                    pathname === `/oplossingen/${solution.slug.current}`;
                  return (
                    <li key={solution._id}>
                      <Link
                        href={`/oplossingen/${solution.slug.current}`}
                        className={`block px-4 py-2 hover:bg-gray-100 whitespace-nowrap${solutionActive ? " text-primary font-bold" : ""}`}
                      >
                        {solution.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        }
        return (
          <li key={link.slug}>
            <Link
              href={`/${link.slug}`}
              className={`font-medium${isActive ? " !font-semibold" : ""}`}
            >
              {link.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
