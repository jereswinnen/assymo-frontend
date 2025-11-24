"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SplitItem {
  image: string;
  alt: string;
  href: string;
  title?: string;
  subtitle?: string;
}

interface SplitSectionProps {
  items: [SplitItem, SplitItem];
  className?: string;
}

export function SplitSection({ items, className }: SplitSectionProps) {
  return (
    <section className={cn("group/split flex w-full gap-2.5", className)}>
      {items.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className="group flex flex-col gap-3 basis-1/2 overflow-hidden transition-[flex-basis] duration-500 ease-out group-hover/split:hover:basis-[55%] group-hover/split:[&:not(:hover)]:basis-[45%]"
        >
          <div className="relative h-[400px] overflow-hidden">
            <Image
              src={item.image}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="flex flex-col [&>*]:!mb-0">
            {item.title && (
              <p className="text-base font-medium">{item.title}</p>
            )}
            {item.subtitle && (
              <p className="text-sm text-stone-600">{item.subtitle}</p>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
