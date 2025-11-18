"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Uitgelogd");
        router.push("/admin/login");
        router.refresh();
      } else {
        toast.error("Uitloggen mislukt");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Er is iets misgegaan");
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {!isLoginPage && (
        <header className="container mx-auto max-w-5xl py-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOutIcon className="size-4" />
            Uitloggen
          </Button>
        </header>
      )}
      <div className="container mx-auto max-w-5xl">{children}</div>
    </div>
  );
}
