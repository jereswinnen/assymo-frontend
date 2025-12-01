import { Action } from "@/components/Action";
import { iconMap } from "@/lib/icons";

interface PageHeaderButton {
  label: string;
  url: string;
  icon: string;
  variant: "primary" | "secondary";
}

interface PageHeaderProps {
  section: {
    title: string;
    subtitle?: string;
    background?: boolean;
    showButtons?: boolean;
    buttons?: PageHeaderButton[];
  };
}

export default function PageHeader({ section }: PageHeaderProps) {
  const { title, subtitle, background, showButtons, buttons } = section;

  const headerClasses = background
    ? "o-grid--bleed col-span-full grid grid-cols-subgrid gap-y-8 py-8 md:py-14 bg-stone-300"
    : "col-span-full flex flex-col gap-8";

  const contentClasses = background
    ? "col-span-full md:w-[900px] flex flex-col gap-4 md:gap-2"
    : "md:w-[900px] flex flex-col gap-4 md:gap-2";

  return (
    <header className={headerClasses}>
      <div className={contentClasses}>
        <h1 className={`mb-0! ${background ? "text-stone-800" : ""}`}>{title}</h1>
        {subtitle && (
          <p
            className={`font-[420] text-lg md:text-xl ${background ? "text-stone-700" : "text-stone-600"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {showButtons && buttons && buttons.length > 0 && (
        <div className={`flex items-center gap-4 ${background ? "col-span-full" : ""}`}>
          {buttons.map((button, index) => {
            const IconComponent = iconMap[button.icon];
            return (
              <Action
                key={index}
                href={button.url}
                icon={IconComponent ? <IconComponent /> : undefined}
                label={button.label}
                variant={button.variant}
              />
            );
          })}
        </div>
      )}
    </header>
  );
}
