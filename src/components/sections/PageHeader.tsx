"use client";

import { Action, actionVariants } from "@/components/shared/Action";
import { iconMap } from "@/lib/icons";
import Image from "next/image";
import { RichText } from "@/components/RichText";
import { cn } from "@/lib/utils";

interface ImageWithUrl {
  url: string;
  alt?: string;
}

interface PageHeaderButton {
  label: string;
  action?: "link" | "openChatbot";
  url?: string;
  icon?: string;
  variant?: "primary" | "secondary";
}

interface PageHeaderProps {
  section: {
    title: string;
    subtitle?: string;
    background?: boolean;
    showImage?: boolean;
    showButtons?: boolean;
    buttons?: PageHeaderButton[];
  };
  headerImage?: ImageWithUrl;
}

export default function PageHeader({ section, headerImage }: PageHeaderProps) {
  const { title, subtitle, background, showImage, showButtons, buttons } =
    section;

  const hasImage = showImage && headerImage;

  return (
    <header
      className={`col-span-full grid grid-cols-subgrid gap-y-8 items-start ${background ? "o-grid--bleed py-8 md:py-14 bg-stone-300" : ""}`}
    >
      <div
        className={`col-span-full ${hasImage ? "md:col-span-4" : ""} flex flex-col justify-center gap-4 md:gap-6`}
      >
        <div
          className={`flex flex-col gap-2 ${!hasImage ? "md:w-[900px]" : ""}`}
        >
          <h1 className={`mb-0! ${background ? "text-stone-800" : ""}`}>
            {title}
          </h1>
          {subtitle && (
            <div
              className={`font-[420] text-stone-600 ${!hasImage ? "text-lg md:text-xl" : "text-base md:text-lg"}`}
            >
              <RichText html={subtitle} />
            </div>
          )}
        </div>
        {showButtons && buttons && buttons.length > 0 && (
          <div className="flex items-center gap-4">
            {buttons.map((button, index) => {
              const IconComponent = button.icon ? iconMap[button.icon] : null;

              if (button.action === "openChatbot") {
                return (
                  <button
                    key={index}
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("openChatbot"))
                    }
                    className={cn(actionVariants({ variant: button.variant }))}
                  >
                    {IconComponent && <IconComponent />}
                    {button.label}
                  </button>
                );
              }

              return (
                <Action
                  key={index}
                  href={button.url || "#"}
                  icon={IconComponent ? <IconComponent /> : undefined}
                  label={button.label}
                  variant={button.variant}
                />
              );
            })}
          </div>
        )}
      </div>
      {hasImage && headerImage?.url && (
        <div className="col-span-full md:col-span-5 relative aspect-5/3">
          <Image
            src={headerImage.url}
            alt={headerImage.alt || ""}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
    </header>
  );
}
