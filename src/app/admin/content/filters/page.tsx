"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  CheckIcon,
  FilterIcon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Filter {
  id: string;
  name: string;
  slug: string;
  order_rank: number;
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
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingCategory, setEditingCategory] = useState<FilterCategory | null>(
    null,
  );
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({
    name: "",
    slug: "",
  });

  // New filter state
  const [newFilterName, setNewFilterName] = useState("");
  const [addingFilter, setAddingFilter] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "filter";
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filterSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/content/filter-categories");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Kon categorieën niet laden");
    } finally {
      setLoading(false);
    }
  };

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (isNewCategory) {
      return categoryName.trim().length > 0;
    }
    return (
      categoryName !== originalValues.name ||
      categorySlug !== originalValues.slug
    );
  }, [isNewCategory, categoryName, categorySlug, originalValues]);

  // Sheet handlers
  const openNewCategorySheet = useCallback(() => {
    setEditingCategory(null);
    setIsNewCategory(true);
    setCategoryName("");
    setCategorySlug("");
    setOriginalValues({ name: "", slug: "" });
    setNewFilterName("");
  }, []);

  const openEditCategorySheet = (category: FilterCategory) => {
    setEditingCategory(category);
    setIsNewCategory(false);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setOriginalValues({
      name: category.name,
      slug: category.slug,
    });
    setNewFilterName("");
  };

  const closeSheet = () => {
    setEditingCategory(null);
    setIsNewCategory(false);
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
          },
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

      closeSheet();
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

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/filter-categories/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Categorie verwijderd");
      if (editingCategory?.id === deleteTarget.id) {
        closeSheet();
      }
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Kon categorie niet verwijderen");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
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
    }
  };

  // Filter handlers
  const handleAddFilter = async () => {
    if (!editingCategory || !newFilterName.trim()) return;

    setAddingFilter(true);
    try {
      const slug = slugify(newFilterName);
      const response = await fetch("/api/admin/content/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFilterName,
          slug,
          category_id: editingCategory.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create");

      const newFilter = await response.json();
      toast.success("Filter toegevoegd");
      setNewFilterName("");

      // Update local state
      const updatedCategory = {
        ...editingCategory,
        filters: [...editingCategory.filters, newFilter],
      };
      setEditingCategory(updatedCategory);
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? updatedCategory : c)),
      );
    } catch (error) {
      console.error("Failed to add filter:", error);
      toast.error("Kon filter niet toevoegen");
    } finally {
      setAddingFilter(false);
    }
  };

  const handleDeleteFilter = async () => {
    if (!deleteTarget || deleteTarget.type !== "filter") return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/filters/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Filter verwijderd");

      // Update local state
      if (editingCategory) {
        const updatedFilters = editingCategory.filters.filter(
          (f) => f.id !== deleteTarget.id,
        );
        const updatedCategory = { ...editingCategory, filters: updatedFilters };
        setEditingCategory(updatedCategory);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updatedCategory : c)),
        );
      }
    } catch (error) {
      console.error("Failed to delete filter:", error);
      toast.error("Kon filter niet verwijderen");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleFilterDragEnd = async (event: DragEndEvent) => {
    if (!editingCategory) return;

    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editingCategory.filters.findIndex(
        (f) => f.id === active.id,
      );
      const newIndex = editingCategory.filters.findIndex(
        (f) => f.id === over.id,
      );

      const newFilters = arrayMove(editingCategory.filters, oldIndex, newIndex);

      // Optimistic update
      const updatedCategory = { ...editingCategory, filters: newFilters };
      setEditingCategory(updatedCategory);
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? updatedCategory : c)),
      );

      try {
        await fetch("/api/admin/content/filters/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: editingCategory.id,
            orderedIds: newFilters.map((f) => f.id),
          }),
        });
      } catch (error) {
        console.error("Failed to reorder filters:", error);
        toast.error("Kon volgorde niet opslaan");
        fetchCategories();
      }
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewCategorySheet}>
        <PlusIcon className="size-4" />
        Nieuwe categorie
      </Button>
    ),
    [openNewCategorySheet],
  );
  useAdminHeaderActions(headerActions);

  const sheetOpen = !!editingCategory || isNewCategory;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FilterIcon className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nog geen categorieën</p>
          <Button size="sm" onClick={openNewCategorySheet}>
            <PlusIcon className="size-4" />
            Eerste categorie aanmaken
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead className="hidden sm:table-cell">URL</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <SortableRow
                    key={category.id}
                    id={category.id}
                    onClick={() => openEditCategorySheet(category)}
                    onDelete={() =>
                      setDeleteTarget({
                        type: "category",
                        id: category.id,
                        name: category.name,
                      })
                    }
                  >
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {category.filters.length} item
                      {category.filters.length !== 1 && "s"}
                    </TableCell>
                  </SortableRow>
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          side="right"
          className="px-4 w-full md:max-w-xl overflow-y-auto"
        >
          <SheetHeader className="px-0">
            <SheetTitle>
              {editingCategory ? "Categorie bewerken" : "Nieuwe categorie"}
            </SheetTitle>
            <SheetDescription>
              {editingCategory
                ? "Bewerk de categorie en beheer de bijbehorende filters."
                : "Maak een nieuwe filtercategorie aan."}
            </SheetDescription>
          </SheetHeader>

          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="category-name">Naam</FieldLabel>
                <Input
                  id="category-name"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (!editingCategory) {
                      setCategorySlug(slugify(e.target.value));
                    }
                  }}
                  placeholder="Materiaal"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="category-slug">URL</FieldLabel>
                <Input
                  id="category-slug"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="materiaal"
                />
              </Field>
            </FieldSet>

            <Separator />

            {/* Filters section - only show when editing existing category */}
            {editingCategory && (
              <FieldSet>
                <FieldLegend variant="label">Filters</FieldLegend>

                <div className="flex gap-2">
                  <Input
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    placeholder="Nieuwe filter..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFilterName.trim()) {
                        e.preventDefault();
                        handleAddFilter();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleAddFilter}
                    disabled={!newFilterName.trim() || addingFilter}
                  >
                    {addingFilter ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <PlusIcon className="size-4" />
                    )}
                  </Button>
                </div>

                {editingCategory.filters.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Nog geen filters in deze categorie
                  </p>
                ) : (
                  <DndContext
                    sensors={filterSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleFilterDragEnd}
                  >
                    <SortableContext
                      items={editingCategory.filters.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1">
                        {editingCategory.filters.map((filter) => (
                          <SortableFilter
                            key={filter.id}
                            filter={filter}
                            onDelete={() =>
                              setDeleteTarget({
                                type: "filter",
                                id: filter.id,
                                name: filter.name,
                              })
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </FieldSet>
            )}
          </FieldGroup>

          <SheetFooter className="px-0">
            <Button
              onClick={handleSaveCategory}
              disabled={savingCategory || !hasChanges}
            >
              {savingCategory ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  {editingCategory ? "Opslaan" : "Aanmaken"}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={
                deleteTarget?.type === "category"
                  ? handleDeleteCategory
                  : handleDeleteFilter
              }
              disabled={deleting}
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

// Reusable sortable row component
function SortableRow({
  id,
  onClick,
  onDelete,
  children,
}: {
  id: string;
  onClick: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <TableCell className="w-10">
        <div className="flex items-center justify-center">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon className="size-4" />
          </button>
        </div>
      </TableCell>
      {children}
      <TableCell className="w-10">
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Sortable filter component
function SortableFilter({
  filter,
  onDelete,
}: {
  filter: Filter;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: filter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 p-2 bg-muted/50 rounded-md"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVerticalIcon className="size-3 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{filter.name}</span>
        <span className="text-xs text-muted-foreground truncate block">
          {filter.slug}
        </span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3" />
      </Button>
    </div>
  );
}
