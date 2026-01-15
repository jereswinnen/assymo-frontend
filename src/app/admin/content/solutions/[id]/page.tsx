"use client";

import { useState, useEffect, use, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUpload, ImageValue } from "@/components/admin/media/ImageUpload";
import { SectionList } from "@/components/admin/SectionList";
import { AddSectionButton } from "@/components/admin/AddSectionButton";
import { PasteSectionButton } from "@/components/admin/PasteSectionButton";
import { SeoPanel } from "@/components/admin/SeoPanel";
import { Section } from "@/types/sections";
import { toast } from "sonner";
import {
  CheckIcon,
  CompassIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface Filter {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  filters: Filter[];
}

interface SolutionData {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: ImageValue | null;
  sections: Section[];
  filters: Filter[];
  meta_title: string | null;
  meta_description: string | null;
  site_id: string;
  created_at: string;
  updated_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SolutionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentSite } = useSiteContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>(
    [],
  );

  // Form state
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(false);
  const [headerImage, setHeaderImage] = useState<ImageValue | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedFilterIds, setSelectedFilterIds] = useState<Set<string>>(
    new Set(),
  );
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [generatingMeta, setGeneratingMeta] = useState(false);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (!solution) return;

    const originalFilterIds = new Set(solution.filters.map((f) => f.id));
    const filtersChanged =
      selectedFilterIds.size !== originalFilterIds.size ||
      [...selectedFilterIds].some((id) => !originalFilterIds.has(id));

    const changed =
      name !== solution.name ||
      (subtitle || "") !== (solution.subtitle || "") ||
      slug !== solution.slug ||
      JSON.stringify(headerImage) !== JSON.stringify(solution.header_image) ||
      JSON.stringify(sections) !== JSON.stringify(solution.sections) ||
      filtersChanged ||
      metaTitle !== (solution.meta_title || "") ||
      metaDescription !== (solution.meta_description || "");

    setHasChanges(changed);
  }, [
    name,
    subtitle,
    slug,
    headerImage,
    sections,
    selectedFilterIds,
    metaTitle,
    metaDescription,
    solution,
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch solution first to get site_id
      const solutionRes = await fetch(`/api/admin/content/solutions/${id}`);

      if (!solutionRes.ok) {
        if (solutionRes.status === 404) {
          toast.error(t("admin.messages.solutionNotFound"));
          router.push("/admin/content/solutions");
          return;
        }
        throw new Error("Failed to fetch solution");
      }

      const solutionData: SolutionData = await solutionRes.json();

      // Fetch filter categories for the solution's site
      const categoriesRes = await fetch(
        `/api/admin/content/filter-categories?siteId=${solutionData.site_id}`,
      );
      const categoriesData: FilterCategory[] = await categoriesRes.json();

      setSolution(solutionData);
      setFilterCategories(categoriesData);

      // Set form values
      setName(solutionData.name);
      setSubtitle(solutionData.subtitle || "");
      setSlug(solutionData.slug);
      setHeaderImage(solutionData.header_image);
      setSections(solutionData.sections || []);
      setSelectedFilterIds(new Set(solutionData.filters.map((f) => f.id)));
      setMetaTitle(solutionData.meta_title || "");
      setMetaDescription(solutionData.meta_description || "");
    } catch {
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setAutoSlug(false);
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilterIds((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  const saveSolution = useCallback(async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error(t("admin.messages.nameSlugRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content/solutions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          slug: slug.trim(),
          header_image: headerImage,
          sections,
          filter_ids: [...selectedFilterIds],
          meta_title: metaTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const updatedSolution = await response.json();
      setSolution(updatedSolution);
      setSections(updatedSolution.sections || []);
      setMetaTitle(updatedSolution.meta_title || "");
      setMetaDescription(updatedSolution.meta_description || "");
      setHasChanges(false);
      toast.success(t("admin.messages.solutionSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.misc.solutionCouldNotSave"),
      );
    } finally {
      setSaving(false);
    }
  }, [id, name, subtitle, slug, headerImage, sections, selectedFilterIds, metaTitle, metaDescription]);

  const generateMetaDescription = async () => {
    setGeneratingMeta(true);
    try {
      // Extract text content from sections for context
      const textContent = sections
        .map((section) => {
          const texts: string[] = [];
          const s = section as unknown as Record<string, unknown>;
          if (s.heading) texts.push(String(s.heading));
          if (s.text) texts.push(String(s.text));
          if (s.subtitle) texts.push(String(s.subtitle));
          return texts.join(" ");
        })
        .filter(Boolean)
        .join(" ")
        .slice(0, 1000);

      const response = await fetch("/api/admin/content/generate-meta-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          content: textContent || subtitle,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const { metaDescription: generated } = await response.json();
      setMetaDescription(generated);
      toast.success(t("admin.messages.metaDescriptionGenerated"));
    } catch {
      toast.error(t("admin.messages.metaDescriptionGenerateFailed"));
    } finally {
      setGeneratingMeta(false);
    }
  };

  const deleteSolution = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/content/solutions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success(t("admin.messages.solutionDeleted"));
      router.push("/admin/content/solutions");
    } catch {
      toast.error(t("admin.messages.solutionDeleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <>
        <Button
          size="sm"
          onClick={saveSolution}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckIcon className="size-4" />
          )}
          {t("admin.buttons.save")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href={`/realisaties/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CompassIcon className="size-4" />
                Open in browser
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2Icon className="size-4" />
              {t("admin.buttons.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    ),
    [slug, saving, hasChanges, saveSolution],
  );
  useAdminHeaderActions(headerActions);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!solution) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - Sections */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="mb-0! text-sm font-medium">{t("admin.misc.sections")}</h3>
            <div className="flex items-center gap-2">
              <AddSectionButton
                onAdd={(section) => setSections([...sections, section])}
              />
              <PasteSectionButton
                onPaste={(section) => setSections([...sections, section])}
              />
            </div>
          </div>
          <SectionList
            sections={sections}
            onChange={setSections}
            onSave={saveSolution}
            saving={saving}
            hasChanges={hasChanges}
            showAddButton={false}
          />
        </div>

        {/* Sidebar */}
        <div className="bg-muted rounded-lg p-4">
          <FieldGroup>
            {/* Algemeen */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="name">{t("admin.labels.name")}</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t("admin.placeholders.solutionName")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="subtitle">{t("admin.labels.subtitle")}</FieldLabel>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder={t("admin.placeholders.optionalSubtitle")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="slug">URL</FieldLabel>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
                <FieldDescription>
                  {currentSite?.domain || "https://..."}/realisaties/
                  {slug || "..."}
                </FieldDescription>
              </Field>
            </FieldSet>

            <FieldSeparator />

            {/* Filters */}
            {filterCategories.length > 0 && (
              <>
                <div className="space-y-4">
                  <FieldLabel>{t("admin.labels.filters")}</FieldLabel>
                  {filterCategories.map((category) => (
                    <div key={category.id}>
                      <p className="text-sm font-medium mb-2">
                        {category.name}
                      </p>
                      {category.filters.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t("admin.misc.noFiltersInCategory")}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {category.filters.map((filter) => (
                            <label
                              key={filter.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedFilterIds.has(filter.id)}
                                onCheckedChange={() => toggleFilter(filter.id)}
                              />
                              <span className="text-sm">{filter.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <FieldSeparator />
              </>
            )}

            {/* SEO */}
            <SeoPanel
              title={name}
              slug={slug}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              onMetaTitleChange={setMetaTitle}
              onMetaDescriptionChange={setMetaDescription}
              onGenerateDescription={generateMetaDescription}
              generating={generatingMeta}
              domain={currentSite?.domain ?? undefined}
              basePath="/realisaties"
              siteName="Assymo"
            />

            <FieldSeparator />

            {/* Header image */}
            <Field>
              <FieldLabel>{t("admin.misc.headerImage")}</FieldLabel>
              <ImageUpload value={headerImage} onChange={setHeaderImage} />
            </Field>

            <FieldSeparator />

            {/* Meta info */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.misc.created")}</span>
                <span>
                  {new Date(solution.created_at).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.misc.lastEdited")}</span>
                <span>
                  {new Date(solution.updated_at).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </FieldGroup>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.deleteSolutionQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteSolutionDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("admin.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSolution}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.deleting")}
                </>
              ) : (
                t("admin.buttons.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
