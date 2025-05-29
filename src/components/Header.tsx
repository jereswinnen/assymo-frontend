import Link from "next/link";
import { client } from "@/sanity/client";

const NAV_QUERY = `*[_type == "navigation"][0]{links}`;

export default async function Header() {
  const nav = await client.fetch(NAV_QUERY);

  return (
    <header className="w-full py-6 flex items-center justify-between border-b">
      <div className="font-bold text-xl">Assymo</div>
      <nav>
        <ul className="flex gap-6">
          {(nav?.links || []).map((link: any) => (
            <li key={link.slug}>
              <Link href={`/${link.slug}`}>{link.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
