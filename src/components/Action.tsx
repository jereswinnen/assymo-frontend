import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

import { cn } from "@/lib/utils";

const actionVariants = cva(
  "w-fit px-3.5 py-2 flex items-center gap-1.5 text-sm font-medium rounded-full transition-colors duration-250 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary:
          "text-accent-light bg-accent-dark hover:text-accent-dark hover:bg-accent-light",
        secondary:
          "text-stone-700 bg-stone-200 hover:text-stone-800 hover:bg-stone-300",
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
