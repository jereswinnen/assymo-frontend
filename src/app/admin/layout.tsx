import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assymo Admin",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
