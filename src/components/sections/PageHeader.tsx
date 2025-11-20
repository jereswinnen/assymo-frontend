import { Action } from "@/components/Action";
import {
  ListTreeIcon,
  Calendar1Icon,
  ArrowRightIcon,
  PhoneIcon,
  MailIcon,
  InfoIcon,
  LucideIcon,
  DownloadIcon,
  MessagesSquareIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  list: ListTreeIcon,
  calendar: Calendar1Icon,
  arrow: ArrowRightIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  info: InfoIcon,
  download: DownloadIcon,
  chat: MessagesSquareIcon,
};

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
    showButtons?: boolean;
    buttons?: PageHeaderButton[];
  };
}

export default function PageHeader({ section }: PageHeaderProps) {
  const { title, subtitle, showButtons, buttons } = section;

  return (
    <header className="col-span-full flex flex-col gap-8">
      <div className="w-[900px] flex flex-col gap-2">
        <h1 className="!mb-0">{title}</h1>
        {subtitle && (
          <p className="font-[420] text-xl text-stone-600">{subtitle}</p>
        )}
      </div>
      {showButtons && buttons && buttons.length > 0 && (
        <div className="flex items-center gap-4">
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
