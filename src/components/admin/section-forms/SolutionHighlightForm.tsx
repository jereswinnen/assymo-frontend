"use client";

import { useEffect, useState } from "react";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SolutionHighlightSection } from "@/types/sections";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface SolutionListItem {
  id: string;
  name: string;
  slug: string;
}

interface SolutionHighlightFormProps {
  section: SolutionHighlightSection;
  onChange: (section: SolutionHighlightSection) => void;
}

export function SolutionHighlightForm({
  section,
  onChange,
}: SolutionHighlightFormProps) {
  const { currentSite } = useSiteContext();
  const [solutions, setSolutions] = useState<SolutionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSolutions() {
      if (!currentSite?.slug) return;

      try {
        const response = await fetch(
          `/api/content/solutions?site=${currentSite.slug}`
        );
        if (response.ok) {
          const data = await response.json();
          setSolutions(data.solutions || []);
        }
      } catch (error) {
        console.error("Failed to fetch solutions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSolutions();
  }, [currentSite?.slug]);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{t("admin.labels.solution")}</FieldLabel>
        <Select
          value={section.solutionId || ""}
          onValueChange={(value) =>
            onChange({ ...section, solutionId: value })
          }
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("admin.placeholders.selectSolution")} />
          </SelectTrigger>
          <SelectContent>
            {solutions.map((solution) => (
              <SelectItem key={solution.id} value={solution.id}>
                {solution.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <RichTextEditor
        label={t("admin.labels.subtitle")}
        value={section.subtitle || ""}
        onChange={(value) => onChange({ ...section, subtitle: value })}
        placeholder={t("admin.placeholders.optionalSubtitle")}
      />
    </FieldGroup>
  );
}
