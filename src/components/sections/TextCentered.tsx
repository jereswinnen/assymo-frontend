import { PortableText } from "@portabletext/react";
import Link from "next/link";

interface TextCenteredProps {
  section: {
    _type: "textCentered";
    content: {
      heading?: string;
      body?: any[];
      cta?: {
        text: string;
        url: string;
      };
    };
  };
}

export default function TextCentered({ section }: TextCenteredProps) {
  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <div className="col-span-full flex flex-col items-center text-center max-w-4xl mx-auto">
        {section.content.heading && (
          <h2 className="mb-6">{section.content.heading}</h2>
        )}

        {section.content.body && (
          <div className="mb-6 [&>*]:text-center">
            <PortableText value={section.content.body} />
          </div>
        )}

        {section.content.cta && (
          <Link
            href={section.content.cta.url}
            className="c-action inline-block"
          >
            {section.content.cta.text}
          </Link>
        )}
      </div>
    </section>
  );
}
