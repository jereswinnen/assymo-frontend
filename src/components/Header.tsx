import { client } from "@/sanity/client";
import Link from "next/link";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import { cn } from "@/lib/utils";
import { Action } from "./Action";
import { Calendar1Icon } from "lucide-react";

const NAV_QUERY = `*[_type == "navigation"][0]{links}`;

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc) {
  _id,
  name,
  slug
}`;

interface HeaderProps {
  className?: string;
}

export default async function Header({ className }: HeaderProps) {
  const [nav, solutions] = await Promise.all([
    client.fetch(NAV_QUERY),
    client.fetch(SOLUTIONS_QUERY),
  ]);

  return (
    <header className={cn("md:sticky md:top-0 z-50 py-8", className)}>
      <div className="mx-auto max-w-site flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-8">
        <Link href="/">
          <Logo className="w-28" />
        </Link>

        <div className="flex flex-auto items-center justify-center">
          <nav className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm bg-amber-200">
            <NavLinks links={nav?.links || []} solutions={solutions} />
          </nav>
        </div>

        <Action
          href="/contact"
          icon={<Calendar1Icon />}
          label="Maak een afspraak"
        />
      </div>
    </header>
  );
}
