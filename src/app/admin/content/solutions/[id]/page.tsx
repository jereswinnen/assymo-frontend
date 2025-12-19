"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import { ImageUpload, ImageValue } from "@/components/admin/ImageUpload";
import { SectionList } from "@/components/admin/SectionList";
import { Section } from "@/types/sections";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(false);
  const [headerImage, setHeaderImage] = useState<ImageValue | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedFilterIds, setSelectedFilterIds] = useState<Set<string>>(new Set());

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
      filtersChanged;

    setHasChanges(changed);
  }, [name, subtitle, slug, headerImage, sections, selectedFilterIds, solution]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [solutionRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/content/solutions/${id}`),
        fetch("/api/admin/content/filter-categories"),
      ]);

      if (!solutionRes.ok) {
        if (solutionRes.status === 404) {
          toast.error("Realisatie niet gevonden");
          router.push("/admin/content/solutions");
          return;
        }
        throw new Error("Failed to fetch solution");
      }

      const [solutionData, categoriesData]: [SolutionData, FilterCategory[]] =
        await Promise.all([solutionRes.json(), categoriesRes.json()]);

      setSolution(solutionData);
      setFilterCategories(categoriesData);

      // Set form values
      setName(solutionData.name);
      setSubtitle(solutionData.subtitle || "");
      setSlug(solutionData.slug);
      setHeaderImage(solutionData.header_image);
      setSections(solutionData.sections || []);
      setSelectedFilterIds(new Set(solutionData.filters.map((f) => f.id)));
    } catch {
      toast.error("Kon gegevens niet ophalen");
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

  const saveSolution = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Naam en slug zijn verplicht");
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const updatedSolution = await response.json();
      setSolution(updatedSolution);
      setSections(updatedSolution.sections || []);
      setHasChanges(false);
      toast.success("Realisatie opgeslagen");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon realisatie niet opslaan"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSolution = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/content/solutions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Realisatie verwijderd");
      router.push("/admin/content/solutions");
    } catch {
      toast.error("Kon realisatie niet verwijderen");
    } finally {
      setDeleting(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content/solutions">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={`/realisaties/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="size-4" />
              Bekijken
            </a>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2Icon className="size-4" />
            Verwijderen
          </Button>
          <Button
            onClick={saveSolution}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Opslaan
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic fields */}
          <Card>
            <CardHeader>
              <CardTitle>Algemeen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Realisatie naam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitel</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Optionele subtitel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="realisatie-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /oplossingen/{slug || "..."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              {filterCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Geen filter categorieën beschikbaar
                </p>
              ) : (
                <div className="space-y-6">
                  {filterCategories.map((category) => (
                    <div key={category.id}>
                      <h4 className="font-medium mb-3">{category.name}</h4>
                      {category.filters.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Geen filters in deze categorie
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
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
              )}
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Secties</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionList sections={sections} onChange={setSections} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Header image */}
          <Card>
            <CardHeader>
              <CardTitle>Header afbeelding</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload value={headerImage} onChange={setHeaderImage} />
            </CardContent>
          </Card>

          {/* Meta info */}
          <Card>
            <CardHeader>
              <CardTitle>Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aangemaakt</span>
                <span>
                  {new Date(solution.created_at).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Laatst bewerkt</span>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Realisatie verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{solution.name}&quot; wilt verwijderen?
              Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSolution}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                "Verwijderen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
