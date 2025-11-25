import Link from "next/link";
import { iconMap } from "@/lib/icons";

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

export default function UspSection({ section }: UspSectionProps) {
  const { heading, usps } = section;

  if (!usps || usps.length === 0) return null;

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      {heading && <h2 className="col-span-full mb-8">{heading}</h2>}
      <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {usps.map((usp, index) => {
          const IconComponent = usp.icon ? iconMap[usp.icon] : null;
          const isFirst = index === 0;
          const isLast = index === usps.length - 1;

          const content = (
            <>
              {IconComponent && (
                <div className="mb-4">
                  <IconComponent className="size-8" />
                </div>
              )}
              <h3 className="text-lg font-medium mb-2">{usp.title}</h3>
              {usp.text && <p className="text-sm opacity-80">{usp.text}</p>}
            </>
          );

          const baseClasses = "p-6 rounded-lg flex flex-col";

          if (isFirst) {
            return (
              <div
                key={index}
                className={`${baseClasses} bg-blue-600 text-white`}
              >
                {content}
              </div>
            );
          }

          if (isLast && usp.link) {
            return (
              <Link
                key={index}
                href={usp.link}
                className={`${baseClasses} bg-amber-500 text-white hover:bg-amber-600 transition-colors`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={index}
              className={`${baseClasses} bg-stone-100 text-stone-800`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
