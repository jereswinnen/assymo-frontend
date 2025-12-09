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

const routeLabels: Record<string, string> = {
  "/admin/appointments": "Afspraken",
  "/admin/emails": "E-mails",
  "/admin/conversations": "Conversaties",
  "/admin/settings": "Instellingen",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    document.title = "Admin - Assymo";
  }, []);

  if (isLoginPage) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-5xl">{children}</div>
      </div>
    );
  }

  const currentLabel = routeLabels[pathname] || "Admin";

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-medium">{currentLabel}</span>
        </header>
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
