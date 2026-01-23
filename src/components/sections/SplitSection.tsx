"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Action } from "../shared/Action";
import { iconMap } from "@/lib/icons";

interface SplitItemAction {
  label: string;
  icon?: string;
  variant?: "primary" | "secondary";
}

interface SplitItem {
  image?: {
    url: string;
    alt?: string;
  };
  title: string;
  subtitle?: string;
  actionType?: "link" | "openChatbot" | "openConfigurator";
  href?: string;
  action?: SplitItemAction;
}

interface SplitSectionProps {
  section: {
    items: [SplitItem, SplitItem, SplitItem?];
  };
  className?: string;
}

export function SplitSection({ section, className }: SplitSectionProps) {
  const router = useRouter();
  const rawItems = section.items;
  const items = rawItems.filter((item): item is SplitItem => item !== undefined);
  const itemCount = items.length;

  const handleItemClick = (item: SplitItem) => {
    if (item.actionType === "openChatbot") {
      window.dispatchEvent(new CustomEvent("openChatbot"));
    } else if (item.actionType === "openConfigurator") {
      router.push("/configurator");
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <section
      className={cn(
        "group/split flex flex-col md:flex-row col-span-full w-full gap-8 md:gap-2.5",
        className,
      )}
    >
      {items.map((item, index) => {
        const IconComponent = item.action?.icon
          ? iconMap[item.action.icon]
          : undefined;

        return (
          <div
            key={index}
            onClick={() => handleItemClick(item)}
            className={cn(
              "group flex flex-col gap-3 overflow-hidden cursor-pointer",
              "md:transition-[flex-basis] duration-700 ease-circ",
              itemCount === 2 &&
                "md:basis-1/2 md:group-hover/split:hover:basis-[54%] md:group-hover/split:not-[&:hover]:basis-[46%]",
              itemCount === 3 &&
                "md:basis-1/3 md:group-hover/split:hover:basis-[42%] md:group-hover/split:not-[&:hover]:basis-[29%]"
            )}
          >
            <div className="relative h-[220px] md:h-[400px] overflow-hidden">
              {item.image?.url && (
                <Image
                  src={item.image.url}
                  alt={item.image.alt || item.title}
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              )}
              {item.action && (
                <div className="absolute inset-0 flex items-center justify-center bg-accent-dark/60 opacity-0 transition-opacity duration-500 ease-circ group-hover:opacity-100">
                  <Action
                    className="translate-y-1.5 blur-xs transition-all duration-600 ease-circ group-hover:translate-y-0 group-hover:blur-none"
                    href={
                      item.actionType === "openChatbot" ||
                      item.actionType === "openConfigurator"
                        ? "#"
                        : item.href || "#"
                    }
                    icon={IconComponent ? <IconComponent /> : undefined}
                    label={item.action.label}
                    variant={item.action.variant || "secondary"}
                    onClick={
                      item.actionType === "openChatbot"
                        ? (e) => {
                            e.preventDefault();
                            window.dispatchEvent(
                              new CustomEvent("openChatbot"),
                            );
                          }
                        : item.actionType === "openConfigurator"
                          ? (e) => {
                              e.preventDefault();
                              router.push("/configurator");
                            }
                          : undefined
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 *:mb-0!">
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
