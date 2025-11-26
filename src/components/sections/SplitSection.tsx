"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/imageUrl";
import { Action } from "../Action";
import { iconMap } from "@/lib/icons";

interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
}

interface SplitItemAction {
  label: string;
  icon?: string;
  variant?: "primary" | "secondary";
}

interface SplitItem {
  image: SanityImage;
  title: string;
  subtitle?: string;
  href: string;
  action?: SplitItemAction;
}

interface SplitSectionProps {
  section: {
    items: [SplitItem, SplitItem];
  };
  className?: string;
}

export function SplitSection({ section, className }: SplitSectionProps) {
  const router = useRouter();
  const { items } = section;

  return (
    <section
      className={cn("group/split flex col-span-full w-full gap-2.5", className)}
    >
      {items.map((item, index) => {
        const IconComponent = item.action?.icon
          ? iconMap[item.action.icon]
          : undefined;

        return (
          <div
            key={index}
            onClick={() => router.push(item.href)}
            className="group flex flex-col gap-3 basis-1/2 overflow-hidden transition-[flex-basis] duration-700 ease-circ group-hover/split:hover:basis-[54%] group-hover/split:[&:not(:hover)]:basis-[46%] cursor-pointer"
          >
            <div className="relative h-[400px] overflow-hidden">
              <Image
                src={urlFor(item.image).width(1200).quality(80).url()}
                alt={item.title}
                fill
                className="object-cover"
                sizes="50vw"
              />
              {item.action && (
                <div className="absolute inset-0 flex items-center justify-center bg-accent-dark/60 opacity-0 transition-opacity duration-500 ease-circ group-hover:opacity-100">
                  <Action
                    className="translate-y-1.5 blur-xs transition-all duration-600 ease-circ group-hover:translate-y-0 group-hover:blur-none"
                    href={item.href}
                    icon={IconComponent ? <IconComponent /> : undefined}
                    label={item.action.label}
                    variant={item.action.variant || "secondary"}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 [&>*]:!mb-0">
              {item.title && (
                <h3 className="text-lg font-medium">{item.title}</h3>
              )}
              {item.subtitle && (
                <p className="text-sm text-stone-600">{item.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
