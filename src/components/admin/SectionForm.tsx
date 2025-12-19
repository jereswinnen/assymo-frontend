"use client";

import {
  Section,
  PageHeaderSection,
  SlideshowSection,
  SolutionsScrollerSection,
  SplitSectionSection,
  UspSectionSection,
  FlexibleSectionSection,
} from "@/types/sections";
import { PageHeaderForm } from "./section-forms/PageHeaderForm";
import { SlideshowForm } from "./section-forms/SlideshowForm";
import { SolutionsScrollerForm } from "./section-forms/SolutionsScrollerForm";
import { SplitSectionForm } from "./section-forms/SplitSectionForm";
import { UspSectionForm } from "./section-forms/UspSectionForm";
import { FlexibleSectionForm } from "./section-forms/FlexibleSectionForm";

interface SectionFormProps {
  section: Section;
  onChange: (section: Section) => void;
}

export function SectionForm({ section, onChange }: SectionFormProps) {
  switch (section._type) {
    case "pageHeader":
      return (
        <PageHeaderForm
          section={section as PageHeaderSection}
          onChange={onChange}
        />
      );

    case "solutionsScroller":
      return (
        <SolutionsScrollerForm
          section={section as SolutionsScrollerSection}
          onChange={onChange}
        />
      );

    case "uspSection":
      return (
        <UspSectionForm
          section={section as UspSectionSection}
          onChange={onChange}
        />
      );

    case "slideshow":
      return (
        <SlideshowForm
          section={section as SlideshowSection}
          onChange={onChange}
        />
      );

    case "splitSection":
      return (
        <SplitSectionForm
          section={section as SplitSectionSection}
          onChange={onChange}
        />
      );

    case "flexibleSection":
      return (
        <FlexibleSectionForm
          section={section as FlexibleSectionSection}
          onChange={onChange}
        />
      );

    default: {
      const unknownSection = section as { _type: string };
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Onbekend sectietype: {unknownSection._type}
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ruwe data bekijken
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(section, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
  }
}
