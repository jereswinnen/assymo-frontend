"use client";

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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-5xl">{children}</div>
    </div>
  );
}
