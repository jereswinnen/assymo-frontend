import { client } from "@/sanity/client";
import HeaderClient from "./HeaderClient";

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
    <HeaderClient
      links={nav?.links || []}
      solutions={solutions}
      className={className}
    />
  );
}
