import ContactForm from "@/components/ContactForm";
import type { FlexFormBlock } from "../types";

interface FormBlockProps {
  block: FlexFormBlock;
}

export default function FormBlock({ block }: FormBlockProps) {
  const { title, subtitle } = block;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {(title || subtitle) && (
        <div className="flex flex-col gap-2">
          {title && <h2 className="mb-0!">{title}</h2>}
          {subtitle && (
            <p className="font-[420] text-stone-600 text-base md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <ContactForm />
    </div>
  );
}
