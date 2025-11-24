"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Action } from "./Action";

interface SplitItem {
  image: string;
  alt: string;
  href: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

interface SplitSectionProps {
  items: [SplitItem, SplitItem];
  className?: string;
}

export function SplitSection({ items, className }: SplitSectionProps) {
  const router = useRouter();

  return (
    <section className={cn("group/split flex w-full gap-2.5", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => router.push(item.href)}
          className="group flex flex-col gap-3 basis-1/2 overflow-hidden transition-[flex-basis] duration-700 ease-circ group-hover/split:hover:basis-[54%] group-hover/split:[&:not(:hover)]:basis-[46%] cursor-pointer"
        >
          <div className="relative h-[400px] overflow-hidden">
            <Image
              src={item.image}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="50vw"
            />
            {item.actionLabel && (
              <div className="absolute inset-0 flex items-center justify-center bg-accent-dark/60 opacity-0 transition-opacity duration-500 ease-circ group-hover:opacity-100">
                <Action
                  className="translate-y-1.5 blur-xs transition-all duration-600 ease-circ group-hover:translate-y-0 group-hover:blur-none"
                  href={item.href}
                  icon={item.actionIcon}
                  label={item.actionLabel}
                  variant="secondary"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col [&>*]:!mb-0">
            {item.title && (
              <p className="text-base font-medium">{item.title}</p>
            )}
            {item.subtitle && (
              <p className="text-sm text-stone-600">{item.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
