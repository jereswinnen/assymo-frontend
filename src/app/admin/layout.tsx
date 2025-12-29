"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  AdminHeaderProvider,
  AdminHeaderActions,
} from "@/components/admin/AdminHeaderContext";
import { SiteProvider, useSiteContext } from "@/lib/permissions/site-context";
import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function getBreadcrumbs(
  pathname: string,
  folderName: string | null
): BreadcrumbSegment[] {
  const routes: Record<string, string> = {
    "/admin/appointments": "Afspraken",
    "/admin/emails": "E-mails",
    "/admin/conversations": "Conversaties",
    "/admin/users": "Gebruikers",
    "/admin/sites": "Sites",
    "/admin/settings": "Instellingen",
    "/admin/account": "Mijn Account",
    "/admin/content/pages": "Pagina's",
    "/admin/content/solutions": "Realisaties",
    "/admin/content/media": "Media",
    "/admin/content/filters": "Filters",
    "/admin/content/navigation": "Navigatie",
    "/admin/content/parameters": "Parameters",
  };

  // Media with folder param - show folder name in breadcrumb
  if (pathname === "/admin/content/media") {
    if (folderName) {
      return [
        { label: "Media", href: "/admin/content/media" },
        { label: folderName },
      ];
    }
    return [{ label: "Media" }];
  }

  // Static routes - single breadcrumb
  if (routes[pathname]) {
    return [{ label: routes[pathname] }];
  }

  // Dynamic routes - parent + current
  if (pathname.startsWith("/admin/emails/")) {
    return [
      { label: "E-mails", href: "/admin/emails" },
      { label: "Nieuwsbrief bewerken" },
    ];
  }
  if (pathname.startsWith("/admin/content/pages/")) {
    return [
      { label: "Pagina's", href: "/admin/content/pages" },
      { label: "Pagina bewerken" },
    ];
  }
  if (pathname.startsWith("/admin/content/solutions/")) {
    return [
      { label: "Realisaties", href: "/admin/content/solutions" },
      { label: "Realisatie bewerken" },
    ];
  }
  if (pathname.startsWith("/admin/content/media/")) {
    return [
      { label: "Media", href: "/admin/content/media" },
      { label: "Afbeelding bekijken" },
    ];
  }

  return [{ label: "Admin" }];
}

// Content paths that should show the site indicator
const SITE_SCOPED_PATHS = [
  "/admin/content/pages",
  "/admin/content/solutions",
  "/admin/content/media",
  "/admin/content/filters",
  "/admin/content/navigation",
  "/admin/content/parameters",
];

function CurrentSiteIndicator() {
  const pathname = usePathname();
  const { currentSite, loading } = useSiteContext();

  // Only show on content pages
  const isContentPage = SITE_SCOPED_PATHS.some((path) => pathname.startsWith(path));
  if (!isContentPage) return null;

  if (loading || !currentSite) return null;

  return (
    <Badge variant="outline" className="text-xs font-normal">
      {currentSite.name}
    </Badge>
  );
}

function AdminBreadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const folderName = searchParams.get("name");
  const breadcrumbs = getBreadcrumbs(pathname, folderName);

  return (
    <div className="flex items-center gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <CurrentSiteIndicator />
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/admin/auth");

  useEffect(() => {
    document.title = "Admin - Assymo";
  }, []);

  // Auth pages render without sidebar
  if (isAuthRoute) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <SiteProvider>
      <AdminHeaderProvider>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset>
            <header className="px-4 flex h-16 shrink-0 items-center gap-2 border-b">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Suspense fallback={null}>
                <AdminBreadcrumbs />
              </Suspense>
              <div className="ml-auto flex items-center gap-2">
                <AdminHeaderActions />
              </div>
            </header>
            <div className="flex-1 p-4">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </AdminHeaderProvider>
    </SiteProvider>
  );
}
