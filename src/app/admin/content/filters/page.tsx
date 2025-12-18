"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

interface Filter {
  id: string;
  name: string;
  slug: string;
}

interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  order_rank: number;
  filters: Filter[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function FiltersPage() {
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FilterCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterSlug, setFilterSlug] = useState("");
  const [savingFilter, setSavingFilter] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "filter";
    id: string;
    name: string;
  } | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/content/filter-categories");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Kon categorieën niet laden");
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const openNewCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategorySlug("");
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: FilterCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Naam is verplicht");
      return;
    }

    setSavingCategory(true);
    try {
      const slug = categorySlug || slugify(categoryName);

      if (editingCategory) {
        const response = await fetch(
          `/api/admin/content/filter-categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: categoryName,
              slug,
              order_rank: editingCategory.order_rank,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to update");
        toast.success("Categorie bijgewerkt");
      } else {
        const response = await fetch("/api/admin/content/filter-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName, slug }),
        });
        if (!response.ok) throw new Error("Failed to create");
        toast.success("Categorie aangemaakt");
      }

      setCategoryDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Kon categorie niet opslaan");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget || deleteTarget.type !== "category") return;

    try {
      const response = await fetch(
        `/api/admin/content/filter-categories/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Categorie verwijderd");
      if (selectedCategoryId === deleteTarget.id) {
        setSelectedCategoryId(null);
      }
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Kon categorie niet verwijderen");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: "up" | "down") => {
    const index = categories.findIndex((c) => c.id === categoryId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === categories.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [
      newCategories[newIndex],
      newCategories[index],
    ];

    setCategories(newCategories);

    try {
      await fetch("/api/admin/content/filter-categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newCategories.map((c) => c.id) }),
      });
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      toast.error("Kon volgorde niet opslaan");
      fetchCategories();
    }
  };

  // Filter handlers
  const openNewFilterDialog = () => {
    if (!selectedCategoryId) return;
    setEditingFilter(null);
    setFilterName("");
    setFilterSlug("");
    setFilterDialogOpen(true);
  };

  const openEditFilterDialog = (filter: Filter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setFilterSlug(filter.slug);
    setFilterDialogOpen(true);
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Naam is verplicht");
      return;
    }

    setSavingFilter(true);
    try {
      const slug = filterSlug || slugify(filterName);

      if (editingFilter) {
        const response = await fetch(
          `/api/admin/content/filters/${editingFilter.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: filterName, slug }),
          }
        );
        if (!response.ok) throw new Error("Failed to update");
        toast.success("Filter bijgewerkt");
      } else {
        const response = await fetch("/api/admin/content/filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: filterName,
            slug,
            category_id: selectedCategoryId,
          }),
        });
        if (!response.ok) throw new Error("Failed to create");
        toast.success("Filter aangemaakt");
      }

      setFilterDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save filter:", error);
      toast.error("Kon filter niet opslaan");
    } finally {
      setSavingFilter(false);
    }
  };

  const handleDeleteFilter = async () => {
    if (!deleteTarget || deleteTarget.type !== "filter") return;

    try {
      const response = await fetch(
        `/api/admin/content/filters/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Filter verwijderd");
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete filter:", error);
      toast.error("Kon filter niet verwijderen");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Filters</h1>
        <p className="text-sm text-muted-foreground">
          Beheer filter categorieën en filters voor realisaties
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Categorieën</CardTitle>
            <Button size="sm" onClick={openNewCategoryDialog}>
              <PlusIcon className="size-4" />
              Nieuw
            </Button>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nog geen categorieën
              </p>
            ) : (
              <div className="space-y-1">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedCategoryId === category.id
                        ? "bg-accent"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-5"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(category.id, "up");
                        }}
                      >
                        <ChevronUpIcon className="size-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-5"
                        disabled={index === categories.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(category.id, "down");
                        }}
                      >
                        <ChevronDownIcon className="size-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.filters.length} filter
                        {category.filters.length !== 1 && "s"}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCategoryDialog(category);
                      }}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({
                          type: "category",
                          id: category.id,
                          name: category.name,
                        });
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">
              {selectedCategory ? `Filters in "${selectedCategory.name}"` : "Filters"}
            </CardTitle>
            <Button
              size="sm"
              onClick={openNewFilterDialog}
              disabled={!selectedCategoryId}
            >
              <PlusIcon className="size-4" />
              Nieuw
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Selecteer een categorie
              </p>
            ) : selectedCategory.filters.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nog geen filters in deze categorie
              </p>
            ) : (
              <div className="space-y-1">
                {selectedCategory.filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{filter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {filter.slug}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => openEditFilterDialog(filter)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() =>
                        setDeleteTarget({
                          type: "filter",
                          id: filter.id,
                          name: filter.name,
                        })
                      }
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Categorie bewerken" : "Nieuwe categorie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Naam</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (!editingCategory) {
                    setCategorySlug(slugify(e.target.value));
                  }
                }}
                placeholder="Bijv. Materiaal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                placeholder="bijv-materiaal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory}>
              {savingCategory && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              {editingCategory ? "Opslaan" : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFilter ? "Filter bewerken" : "Nieuw filter"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Naam</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => {
                  setFilterName(e.target.value);
                  if (!editingFilter) {
                    setFilterSlug(slugify(e.target.value));
                  }
                }}
                placeholder="Bijv. Hout"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-slug">Slug</Label>
              <Input
                id="filter-slug"
                value={filterSlug}
                onChange={(e) => setFilterSlug(e.target.value)}
                placeholder="bijv-hout"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFilterDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveFilter} disabled={savingFilter}>
              {savingFilter && <Loader2Icon className="size-4 animate-spin" />}
              {editingFilter ? "Opslaan" : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "category"
                ? "Categorie verwijderen?"
                : "Filter verwijderen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "category"
                ? `"${deleteTarget?.name}" en alle bijbehorende filters worden permanent verwijderd.`
                : `"${deleteTarget?.name}" wordt permanent verwijderd.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={
                deleteTarget?.type === "category"
                  ? handleDeleteCategory
                  : handleDeleteFilter
              }
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
