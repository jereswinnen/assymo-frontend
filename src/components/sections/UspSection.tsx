import Link from "next/link";
import { iconMap } from "@/lib/icons";
import { ArrowBigDownDashIcon, ArrowUpRightIcon } from "lucide-react";

interface Usp {
  icon?: string;
  title: string;
  text?: string;
  link?: string;
}

interface UspSectionProps {
  section: {
    heading?: string;
    usps?: Usp[];
  };
}

function UspCard({
  usp,
  variant,
}: {
  usp: Usp;
  variant: "primary" | "secondary" | "cta";
}) {
  const IconComponent = usp.icon ? iconMap[usp.icon] : null;

  const variantClasses = {
    primary: "bg-white justify-between",
    secondary: "bg-whie",
    cta: "group bg-accent-dark text-white ease-circ duration-400 transition-all hover:-translate-y-1.5",
  };

  const baseClasses = "p-5 flex flex-col gap-3 h-full text-stone-600";

  if (variant === "primary") {
    return (
      <div className={`${baseClasses} ${variantClasses.primary}`}>
        {IconComponent && <IconComponent className="size-6 text-stone-600" />}
        <div className="flex flex-col gap-1">
          <p className="text-lg font-medium text-stone-800 mb-0!">
            {usp.title}
          </p>
          {usp.text && <p className="text-base mb-0!">{usp.text}</p>}
        </div>
      </div>
    );
  }

  const content = (
    <>
      {IconComponent && <IconComponent className="size-6 text-stone-600" />}
      <div className="flex flex-col gap-1">
        <p className="text-lg font-medium text-stone-800 mb-0!">{usp.title}</p>
        {usp.text && <p className="text-sm mb-0!">{usp.text}</p>}
      </div>
    </>
  );

  // Handle link as string or object with href/url property
  const linkUrl = typeof usp.link === "string"
    ? usp.link.trim()
    : (usp.link?.href || usp.link?.url || "").trim();

  if (variant === "cta" && linkUrl) {
    return (
      <Link href={linkUrl} className={`${baseClasses} ${variantClasses.cta}`}>
        <header className="flex items-center justify-between text-accent-light">
          {IconComponent && <IconComponent className="size-6" />}
          <ArrowUpRightIcon className="size-6 opacity-0 -translate-x-1.5 translate-y-1.5 ease-circ duration-400 transition-all group-hover:opacity-100 group-hover:translate-0" />
        </header>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-medium mb-0!">{usp.title}</p>
          {usp.text && <p className="text-sm opacity-70 mb-0!">{usp.text}</p>}
        </div>
      </Link>
    );
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>{content}</div>
  );
}

export default function UspSection({ section }: UspSectionProps) {
  const { heading, usps } = section;

  if (!usps || usps.length === 0) return null;

  const [firstUsp, ...remainingUsps] = usps;

  return (
    <section className="o-grid--bleed col-span-full grid grid-cols-subgrid gap-y-8 py-10 md:py-14 bg-stone-100">
      {heading && <h2 className="col-span-full text-stone-700">{heading}</h2>}
      <div className="col-span-full flex flex-col lg:flex-row gap-8 md:gap-2.5">
        {/* Left column: 40% */}
        <div className="md:basis-2/5 md:shrink-0">
          <UspCard usp={firstUsp} variant="primary" />
        </div>

        {/* Right column: 60% with flex wrap */}
        <div className="md:basis-3/5 flex flex-wrap gap-4 md:gap-2.5">
          {remainingUsps.map((usp, index) => {
            const isLast = index === remainingUsps.length - 1;
            return (
              <div key={index} className="basis-[calc(50%-0.5rem)]">
                <UspCard usp={usp} variant={isLast ? "cta" : "secondary"} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
