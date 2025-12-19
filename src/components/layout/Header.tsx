import { getNavigation, getSiteParameters } from "@/lib/content";
import HeaderClient from "./HeaderClient";

interface HeaderProps {
  className?: string;
}

export default async function Header({ className }: HeaderProps) {
  const [navLinks, parameters] = await Promise.all([
    getNavigation("header"),
    getSiteParameters(),
  ]);

  // Transform navigation links to match HeaderClient's expected format
  const links = navLinks.map((link) => ({
    title: link.title,
    slug: link.slug,
    submenuHeading: link.submenu_heading ?? undefined,
    subItems: link.sub_items
      ?.filter((item) => item.solution)
      .map((item) => ({
        name: item.solution!.name,
        slug: item.solution!.slug,
        headerImage: item.solution!.header_image ?? undefined,
      })),
  }));

  // Transform site parameters to convert null to undefined
  const settings = parameters
    ? {
        address: parameters.address ?? undefined,
        phone: parameters.phone ?? undefined,
        email: parameters.email ?? undefined,
        instagram: parameters.instagram ?? undefined,
        facebook: parameters.facebook ?? undefined,
      }
    : undefined;

  return (
    <HeaderClient
      links={links}
      settings={settings}
      className={className}
    />
  );
}
