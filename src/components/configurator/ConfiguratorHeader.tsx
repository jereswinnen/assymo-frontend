"use client";

import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { Action } from "@/components/shared/Action";
import { PhoneIcon } from "lucide-react";
import { useTracking } from "@/lib/tracking";

interface ConfiguratorHeaderProps {
  phone?: string;
}

export function ConfiguratorHeader({ phone }: ConfiguratorHeaderProps) {
  const { track } = useTracking();

  return (
    <header className="flex items-center justify-between py-8">
      <Link href="/">
        <Logo className="w-28" />
      </Link>

      {phone && (
        <Action
          href={`tel:${phone}`}
          icon={<PhoneIcon />}
          label={phone}
          onClick={() =>
            track("outbound_clicked", {
              type: "phone",
            })
          }
        />
      )}
    </header>
  );
}
