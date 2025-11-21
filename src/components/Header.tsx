import { client } from "@/sanity/client";
import Link from "next/link";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import { cn } from "@/lib/utils";
import { Action } from "./Action";
import {
  Calendar1Icon,
  FacebookIcon,
  InstagramIcon,
  PhoneIcon,
} from "lucide-react";
import { Separator } from "./ui/separator";

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
    <header
      className={cn(
        "md:flex md:flex-col md:gap-16 md:sticky md:top-0 z-50 py-8 bg-amber-200",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-site flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-8">
        <Link href="/">
          <Logo className="w-28" />
        </Link>

        <nav className="text-sm bg-ambr-200">
          <NavLinks links={nav?.links || []} solutions={solutions} />
        </nav>

        <Action
          href="/contact"
          icon={<Calendar1Icon />}
          label="Maak een afspraak"
        />
      </div>

      <div className="mx-auto w-full max-w-site flex gap-8 bg-pink-200">
        <figure className="w-2xs">
          <img
            src="https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
          />
        </figure>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-stone-600">Ontdek</span>
          <ul className="flex flex-col gap-1.5 text-2xl font-semibold [&>*>*]:block [&>*>*]:transition-all [&>*>*]:duration-300 [&>*>*]:hover:translate-x-1.5">
            <li>
              <a href="#">Trappen</a>
            </li>
            <li>
              <a href="#">Badkamer</a>
            </li>
            <li>
              <a href="#">Keuken</a>
            </li>
            <li>
              <a href="#">Bureau</a>
            </li>
            <li>
              <a href="#">Meubilair</a>
            </li>
          </ul>
        </div>
        <div className="ml-auto w-3xs flex flex-col gap-3">
          <span className="text-xs font-medium text-stone-600">Contacteer</span>
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-3 text-base font-medium">
              <li>
                Eikenlei 159,<br></br>2960 Sint-Job-in-&apos;t-Goor
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                >
                  <PhoneIcon className="size-4" />
                  <span>+32 (0) 3 434 74 98</span>
                </a>
              </li>
            </ul>
            <Separator />
            <ul className="flex flex-col gap-3 text-sm font-medium">
              <li>
                <a
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                  href="#"
                >
                  <InstagramIcon className="size-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                  href="#"
                >
                  <FacebookIcon className="size-4" />
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
