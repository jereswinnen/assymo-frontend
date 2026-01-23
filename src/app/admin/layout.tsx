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
import { t } from "@/config/strings";

interface BreadcrumbSegment {
  label: string;
  href?: string;
  dropdown?: "pages" | "solutions" | "configurator";
}

function getBreadcrumbs(
  pathname: string,
  folderName: string | null,
  dynamicTitle: string | null
): BreadcrumbSegment[] {
  const routes: Record<string, string> = {
    "/admin/appointments": t("admin.nav.appointments"),
    "/admin/emails": t("admin.nav.emails"),
    "/admin/conversations": t("admin.nav.conversations"),
    "/admin/users": t("admin.nav.users"),
    "/admin/sites": t("admin.nav.sites"),
    "/admin/settings": t("admin.nav.settings"),
    "/admin/account": t("admin.nav.account"),
    "/admin/content/pages": t("admin.nav.pages"),
    "/admin/content/solutions": t("admin.nav.solutions"),
    "/admin/content/media": t("admin.nav.media"),
    "/admin/content/image-studio": t("admin.nav.imageStudio"),
    "/admin/content/filters": t("admin.nav.filters"),
    "/admin/content/navigation": t("admin.nav.navigation"),
    "/admin/content/parameters": t("admin.nav.parameters"),
    "/admin/content/configurator": t("admin.nav.configurator"),
  };

  // Media with folder param - show folder name in breadcrumb
  if (pathname === "/admin/content/media") {
    if (folderName) {
      return [
        { label: t("admin.nav.media"), href: "/admin/content/media" },
        { label: folderName },
      ];
    }
    return [{ label: t("admin.nav.media") }];
  }

  // Static routes - single breadcrumb
  if (routes[pathname]) {
    return [{ label: routes[pathname] }];
  }

  // Dynamic routes - parent + current
  if (pathname.startsWith("/admin/emails/")) {
    return [
      { label: t("admin.nav.emails"), href: "/admin/emails" },
      { label: t("admin.misc.editNewsletter") },
    ];
  }
  if (pathname.startsWith("/admin/content/pages/")) {
    const crumbs: BreadcrumbSegment[] = [
      { label: t("admin.nav.pages"), href: "/admin/content/pages" },
    ];
    if (dynamicTitle !== null) {
      crumbs.push({
        label: dynamicTitle || t("admin.misc.editPage"),
        dropdown: "pages",
      });
    }
    return crumbs;
  }
  if (pathname.startsWith("/admin/content/solutions/")) {
    const crumbs: BreadcrumbSegment[] = [
      { label: t("admin.nav.solutions"), href: "/admin/content/solutions" },
    ];
    if (dynamicTitle !== null) {
      crumbs.push({
        label: dynamicTitle || t("admin.misc.editSolution"),
        dropdown: "solutions",
      });
    }
    return crumbs;
  }
  if (pathname.startsWith("/admin/content/media/")) {
    return [
      { label: t("admin.nav.media"), href: "/admin/content/media" },
      { label: t("admin.misc.viewImage") },
    ];
  }
  // Configurator product questions page
  if (pathname.match(/^\/admin\/content\/configurator\/(?!pricing)[^/]+$/)) {
    const crumbs: BreadcrumbSegment[] = [
      { label: t("admin.nav.configurator"), href: "/admin/content/configurator" },
    ];
    if (dynamicTitle !== null) {
      crumbs.push({
        label: dynamicTitle || t("admin.headings.questions"),
        dropdown: "configurator",
      });
    }
    return crumbs;
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
