"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const getRouteLabel = (pathname: string): string => {
  const staticLabels: Record<string, string> = {
    "/admin/appointments": "Afspraken",
    "/admin/emails": "E-mails",
    "/admin/conversations": "Conversaties",
    "/admin/settings": "Instellingen",
  };

  if (staticLabels[pathname]) {
    return staticLabels[pathname];
  }

  // Dynamic routes
  if (pathname.startsWith("/admin/emails/")) {
    return "Nieuwsbrief bewerken";
  }

  return "Admin";
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/admin/login" || pathname === "/admin/reset-password";

  useEffect(() => {
    document.title = "Admin - Assymo";
  }, []);

  if (isAuthPage) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-5xl">{children}</div>
      </div>
    );
  }

  const currentLabel = getRouteLabel(pathname);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="p-4 flex shrink-0 items-center gap-3 border-b">
          <SidebarTrigger />
          <span className="font-medium">{currentLabel}</span>
        </header>
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
