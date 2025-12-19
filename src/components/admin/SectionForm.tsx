"use client";

import {
  Section,
  SlideshowSection,
  SolutionsScrollerSection,
  UspSectionSection,
  getSectionLabel,
} from "@/types/sections";
import { SlideshowForm } from "./section-forms/SlideshowForm";
import { SolutionsScrollerForm } from "./section-forms/SolutionsScrollerForm";
import { UspSectionForm } from "./section-forms/UspSectionForm";

interface SectionFormProps {
  section: Section;
  onChange: (section: Section) => void;
}

export function SectionForm({ section, onChange }: SectionFormProps) {
  switch (section._type) {
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

    // Placeholder for forms coming in phases 14-16
    case "pageHeader":
    case "splitSection":
    case "flexibleSection":
    default:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {getSectionLabel(section._type)} formulier wordt toegevoegd in een
            volgende fase.
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
