"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  AdminHeaderProvider,
  AdminHeaderActions,
} from "@/components/admin/AdminHeaderContext";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

const getRouteLabel = (pathname: string): string => {
  const staticLabels: Record<string, string> = {
    "/admin/appointments": "Afspraken",
    "/admin/emails": "E-mails",
    "/admin/conversations": "Conversaties",
    "/admin/settings": "Instellingen",
    "/admin/content/pages": "Pagina's",
    "/admin/content/solutions": "Realisaties",
    "/admin/content/media": "Media",
    "/admin/content/filters": "Filters",
    "/admin/content/navigation": "Navigatie",
    "/admin/content/parameters": "Parameters",
  };

  if (staticLabels[pathname]) {
    return staticLabels[pathname];
  }

  // Dynamic routes
  if (pathname.startsWith("/admin/emails/")) {
    return "Nieuwsbrief bewerken";
  }
  if (pathname.startsWith("/admin/content/pages/")) {
    return "Pagina bewerken";
  }
  if (pathname.startsWith("/admin/content/solutions/")) {
    return "Realisatie bewerken";
  }
  if (pathname.startsWith("/admin/content/media/")) {
    return "Afbeelding bewerken";
  }

  return "Admin";
};

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

  const currentLabel = getRouteLabel(pathname);

  return (
    <AdminHeaderProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="p-4 flex shrink-0 items-center gap-3 border-b">
            <SidebarTrigger />
            <span className="font-medium">{currentLabel}</span>
            <div className="ml-auto flex items-center gap-2">
              <AdminHeaderActions />
            </div>
          </header>
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </AdminHeaderProvider>
  );
}
