import { client } from "@/sanity/client";
import HeaderClient from "./HeaderClient";

const NAV_QUERY = `*[_type == "navigation"][0]{
  links[]{
    title,
    slug,
    submenuHeading,
    subItems[]->{
      name,
      slug,
      headerImage{
        asset,
        hotspot,
        alt
      }
    }
  }
}`;

const PARAMETERS_QUERY = `*[_type == "siteParameters"][0]{
  address,
  phone,
  instagram,
  facebook
}`;

interface HeaderProps {
  className?: string;
}

export default async function Header({ className }: HeaderProps) {
  const [nav, parameters] = await Promise.all([
    client.fetch(NAV_QUERY),
    client.fetch(PARAMETERS_QUERY),
  ]);

  return (
    <HeaderClient
      links={nav?.links || []}
      settings={parameters}
      className={className}
    />
  );
}
