"use client";

import Logo from "@/components/layout/Logo";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    document.title = "Admin - Assymo";
  }, []);

  return (
    <main className="relative p-4 flex min-h-screen bg-[url(/images/auth-bg.avif)] bg-cover bg-center *:flex *:flex-1 *:items-center *:justify-center">
      <section className="z-10">
        <Logo className="w-64 text-white" />
      </section>
      <section className="z-10 p-4 bg-white rounded-3xl">{children}</section>
      <div className="absolute inset-0 bg-black/15"></div>
    </main>
  );
}
