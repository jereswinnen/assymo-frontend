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
    <main className="relative p-6 md:p-4 flex flex-col md:flex-row min-h-screen bg-[url(/images/auth-bg.avif)] bg-cover bg-center *:flex *:items-center *:justify-center">
      <section className="z-10 flex-1">
        <Logo className="w-52 md:w-72 text-white" />
      </section>
      <section className="z-10 p-8 md:p-4 md:flex-1 bg-white rounded-3xl">
        {children}
      </section>
      <div className="absolute inset-0 bg-black/30"></div>
    </main>
  );
}
