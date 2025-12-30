"use client";

import { RichText } from "@/components/RichText";
import { Action, actionVariants } from "@/components/shared/Action";
import { iconMap } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { FlexTextBlock } from "../types";

interface TextBlockProps {
  block: FlexTextBlock;
}

export default function TextBlock({ block }: TextBlockProps) {
  const { heading, headingLevel = "h2", text, button } = block;

  const IconComponent =
    button?.icon && button.icon in iconMap ? iconMap[button.icon] : null;

  const handleOpenChatbot = () => {
    window.dispatchEvent(new CustomEvent("openChatbot"));
  };

  const renderHeading = () => {
    if (!heading) return null;
    switch (headingLevel) {
      case "h3":
        return <h3 className="mb-0!">{heading}</h3>;
      case "h4":
        return <h4 className="mb-0!">{heading}</h4>;
      default:
        return <h2 className="mb-0!">{heading}</h2>;
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        {renderHeading()}
        {text && (
          <div className="font-[420] text-stone-600 text-base md:text-lg">
            <RichText html={text} />
          </div>
        )}
      </div>
      {button?.label && (
        button.action === "openChatbot" ? (
          <button
            onClick={handleOpenChatbot}
            className={cn(actionVariants({ variant: button.variant }))}
          >
            {IconComponent && <IconComponent />}
            {button.label}
          </button>
        ) : button.url ? (
          <Action
            href={button.url}
            icon={IconComponent ? <IconComponent /> : undefined}
            label={button.label}
            variant={button.variant}
          />
        ) : null
      )}
    </div>
  );
}
