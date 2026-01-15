"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Dynamic import with SSR disabled to prevent hydration mismatches
// The sidebar requires client-side session data and Radix UI components
const AdminSidebar = dynamic(
  () => import("@/components/admin/AdminSidebar").then((mod) => mod.AdminSidebar),
  { ssr: false }
);
import {
  AdminHeaderProvider,
  AdminHeaderActions,
  useAdminBreadcrumb,
} from "@/components/admin/AdminHeaderContext";
import { SiteProvider } from "@/lib/permissions/site-context";
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
import { BreadcrumbDropdown } from "@/components/admin/BreadcrumbDropdown";

interface BreadcrumbSegment {
  label: string;
  href?: string;
  dropdown?: "pages" | "solutions";
}

function getBreadcrumbs(
  pathname: string,
  folderName: string | null,
  dynamicTitle: string | null
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
    const crumbs: BreadcrumbSegment[] = [
      { label: "Pagina's", href: "/admin/content/pages" },
    ];
    if (dynamicTitle !== null) {
      crumbs.push({
        label: dynamicTitle || "Pagina bewerken",
        dropdown: "pages",
      });
    }
    return crumbs;
  }
  if (pathname.startsWith("/admin/content/solutions/")) {
    const crumbs: BreadcrumbSegment[] = [
      { label: "Realisaties", href: "/admin/content/solutions" },
    ];
    if (dynamicTitle !== null) {
      crumbs.push({
        label: dynamicTitle || "Realisatie bewerken",
        dropdown: "solutions",
      });
    }
    return crumbs;
  }
  if (pathname.startsWith("/admin/content/media/")) {
    return [
      { label: "Media", href: "/admin/content/media" },
      { label: "Afbeelding bekijken" },
    ];
  }

  return [{ label: "Admin" }];
}

function AdminBreadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const folderName = searchParams.get("name");
  const dynamicTitle = useAdminBreadcrumb();
  const breadcrumbs = getBreadcrumbs(pathname, folderName, dynamicTitle);

  return (
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
              ) : crumb.dropdown ? (
                <BreadcrumbDropdown
                  type={crumb.dropdown}
                  currentTitle={crumb.label}
                />
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
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
