"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronsLeftRightEllipsisIcon,
  FileTextIcon,
  FolderTreeIcon,
  ImageIcon,
  LogOutIcon,
  MailboxIcon,
  MenuIcon,
  MessagesSquareIcon,
  SettingsIcon,
  ToggleRightIcon,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Logo from "@/components/layout/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/admin/appointments", label: "Afspraken", icon: CalendarDaysIcon },
  { href: "/admin/emails", label: "E-mails", icon: MailboxIcon },
  {
    href: "/admin/conversations",
    label: "Conversaties",
    icon: MessagesSquareIcon,
  },
  { href: "/admin/settings", label: "Instellingen", icon: SettingsIcon },
];

const contentItems = [
  { href: "/admin/content/pages", label: "Pagina's", icon: FileTextIcon },
  {
    href: "/admin/content/solutions",
    label: "Realisaties",
    icon: FolderTreeIcon,
  },
  { href: "/admin/content/media", label: "Media", icon: ImageIcon },
  { href: "/admin/content/filters", label: "Filters", icon: ToggleRightIcon },
  { href: "/admin/content/navigation", label: "Navigatie", icon: MenuIcon },
  {
    href: "/admin/content/parameters",
    label: "Parameters",
    icon: ChevronsLeftRightEllipsisIcon,
  },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast.success("Uitgelogd");
      router.push("/admin/auth");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Er is iets misgegaan");
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="py-4 flex items-start">
        <Logo className="w-auto h-6" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Uitloggen">
              <LogOutIcon />
              <span>Uitloggen</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
