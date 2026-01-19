"use client";

import { useTracking } from "@/lib/tracking";
import { ReactNode } from "react";

interface TrackedOutboundLinkProps {
  href: string;
  type: "phone" | "email" | "instagram" | "facebook";
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}

export function TrackedOutboundLink({
  href,
  type,
  className,
  children,
  target,
  rel,
}: TrackedOutboundLinkProps) {
  const { track } = useTracking();

  const handleClick = () => {
    track("outbound_clicked", { type });
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}
