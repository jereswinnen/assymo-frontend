"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronsLeftRightEllipsisIcon,
  ChevronsUpDownIcon,
  CompassIcon,
  FileTextIcon,
  FolderTreeIcon,
  ImageIcon,
  LogOutIcon,
  MailboxIcon,
  MenuIcon,
  MessagesSquareIcon,
  SettingsIcon,
  ToggleRightIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Logo from "@/components/layout/Logo";
import { SiteSelector } from "@/components/admin/SiteSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { type Feature, type Role } from "@/lib/permissions/types";

// Nav items with their required feature
const navItems: {
  href: string;
  label: string;
  icon: typeof CalendarDaysIcon;
  feature: Feature;
}[] = [
  {
    href: "/admin/appointments",
    label: "Afspraken",
    icon: CalendarDaysIcon,
    feature: "appointments",
  },
  {
    href: "/admin/emails",
    label: "E-mails",
    icon: MailboxIcon,
    feature: "emails",
  },
  {
    href: "/admin/conversations",
    label: "Conversaties",
    icon: MessagesSquareIcon,
    feature: "conversations",
  },
  {
    href: "/admin/users",
    label: "Gebruikers",
    icon: UsersRoundIcon,
    feature: "users",
  },
  { href: "/admin/sites", label: "Sites", icon: CompassIcon, feature: "sites" },
  {
    href: "/admin/settings",
    label: "Instellingen",
    icon: SettingsIcon,
    feature: "settings",
  },
];

const contentItems: {
  href: string;
  label: string;
  icon: typeof FileTextIcon;
  feature: Feature;
}[] = [
  {
    href: "/admin/content/pages",
    label: "Pagina's",
    icon: FileTextIcon,
    feature: "pages",
  },
  {
    href: "/admin/content/solutions",
    label: "Realisaties",
    icon: FolderTreeIcon,
    feature: "solutions",
  },
  {
    href: "/admin/content/media",
    label: "Media",
    icon: ImageIcon,
    feature: "media",
  },
  {
    href: "/admin/content/filters",
    label: "Filters",
    icon: ToggleRightIcon,
    feature: "filters",
  },
  {
    href: "/admin/content/navigation",
    label: "Navigatie",
    icon: MenuIcon,
    feature: "navigation",
  },
  {
    href: "/admin/content/parameters",
    label: "Parameters",
    icon: ChevronsLeftRightEllipsisIcon,
    feature: "parameters",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface UserData {
  name: string;
  email: string;
  image: string | null;
}

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<UserData | null>(null);
  const [effectiveFeatures, setEffectiveFeatures] = useState<Feature[] | null>(
    null,
  );

  // Load user info from session (for display)
  useEffect(() => {
    async function loadUser() {
      const { data } = await authClient.getSession();
      if (data?.user) {
        setUser({
          name: data.user.name || "Gebruiker",
          email: data.user.email,
          image: data.user.image || null,
        });
      }
    }
    loadUser();
  }, []);

  // Load effective features from API (fresh from database)
  useEffect(() => {
    async function loadPermissions() {
      try {
        const response = await fetch("/api/admin/user-permissions");
        if (response.ok) {
          const data = await response.json();
          setEffectiveFeatures(data.effectiveFeatures);
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      }
    }
    loadPermissions();
  }, []);

  // Filter nav items based on effective features
  // Show empty arrays while loading to prevent flash of all items
  const visibleNavItems = useMemo(
    () =>
      effectiveFeatures === null
        ? []
        : navItems.filter((item) => effectiveFeatures.includes(item.feature)),
    [effectiveFeatures],
  );

  const visibleContentItems = useMemo(
    () =>
      effectiveFeatures === null
        ? []
        : contentItems.filter((item) =>
            effectiveFeatures.includes(item.feature),
          ),
    [effectiveFeatures],
  );

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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4 space-y-3">
        <Link href="/admin/appointments">
          <Logo className="w-auto h-6" />
        </Link>
        <SiteSelector />
      </SidebarHeader>
      <SidebarContent>
        {effectiveFeatures === null ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...Array(4)].map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <div className="flex items-center gap-2 px-2 py-2">
                      <Skeleton className="size-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {visibleNavItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleNavItems.map((item) => {
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
            )}
            {visibleContentItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Content</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleContentItems.map((item) => {
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
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={user?.image || undefined} asChild>
                      {user?.image && (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      )}
                    </AvatarImage>
                    <AvatarFallback className="rounded-lg">
                      {user ? getInitials(user.name) : ".."}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.name || "Laden..."}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={user?.image || undefined} asChild>
                        {user?.image && (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        )}
                      </AvatarImage>
                      <AvatarFallback className="rounded-lg">
                        {user ? getInitials(user.name) : ".."}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.name || "Laden..."}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/account">
                    <UserRoundIcon />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
