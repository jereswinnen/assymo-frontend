"use client";

import { Section, getSectionLabel } from "@/types/sections";

interface SectionFormProps {
  section: Section;
  onChange: (section: Section) => void;
}

export function SectionForm({ section, onChange }: SectionFormProps) {
  // Placeholder - will be expanded in phases 13-16
  // For now, just show that the section form will go here

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
