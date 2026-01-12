import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

import { cn } from "@/lib/utils";

const actionVariants = cva(
  "cursor-pointer w-fit px-3.5 py-2 flex items-center gap-1.5 text-sm font-medium rounded-full transition-colors duration-250 [&_svg]:size-4 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "text-accent-light bg-accent-dark hover:text-accent-dark hover:bg-accent-light disabled:hover:bg-accent-dark disabled:hover:text-accent-light",
        secondary:
          "text-zinc-800 bg-zinc-300 hover:text-zinc-700 hover:bg-zinc-200 disabled:hover:bg-zinc-300 disabled:hover:text-zinc-800",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ActionProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof actionVariants> {
  href: string;
  icon?: React.ReactNode;
  label: string;
}

function Action({
  className,
  variant,
  href,
  icon,
  label,
  ...props
}: ActionProps) {
  return (
    <Link
      href={href}
      className={cn(actionVariants({ variant, className }))}
      {...props}
    >
      {icon}
      {label}
    </Link>
  );
}

export { Action, actionVariants };
