"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CalendarDaysIcon,
  MailIcon,
  MessagesSquareIcon,
  ScanTextIcon,
  SettingsIcon,
} from "lucide-react";

const navItems = [
  { href: "/admin/appointments", label: "Afspraken", icon: CalendarDaysIcon },
  { href: "/admin/emails", label: "E-mails", icon: MailIcon },
  { href: "/admin/conversations", label: "Conversaties", icon: MessagesSquareIcon },
  { href: "/admin/embeddings", label: "Embeddings", icon: ScanTextIcon },
  { href: "/admin/settings", label: "Instellingen", icon: SettingsIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-muted inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] mb-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] [&_svg]:shrink-0 [&_svg]:size-4",
              isActive
                ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
