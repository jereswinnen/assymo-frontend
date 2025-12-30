"use client";

import { useState, useMemo } from "react";
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

interface FilterCategorySheetProps {
  category: FilterCategory | null;
  siteId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onCategoryUpdated: (category: FilterCategory) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function FilterCategorySheet({
  category,
  siteId,
  open,
  onOpenChange,
  onSaved,
  onCategoryUpdated,
}: FilterCategorySheetProps) {
  const isNew = !category;

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({ name: "", slug: "" });

  // Filter state
  const [newFilterName, setNewFilterName] = useState("");
  const [addingFilter, setAddingFilter] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FilterCategory | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "filter";
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filterSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Initialize form when sheet opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && category) {
      setCategoryName(category.name);
      setCategorySlug(category.slug);
      setOriginalValues({ name: category.name, slug: category.slug });
      setEditingCategory(category);
    } else if (newOpen && !category) {
      setCategoryName("");
      setCategorySlug("");
      setOriginalValues({ name: "", slug: "" });
      setEditingCategory(null);
    }
    setNewFilterName("");
    onOpenChange(newOpen);
  };

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (isNew) {
      return categoryName.trim().length > 0;
    }
    return (
      categoryName !== originalValues.name ||
      categorySlug !== originalValues.slug
    );
  }, [isNew, categoryName, categorySlug, originalValues]);

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
        if (!siteId) return;
        const response = await fetch("/api/admin/content/filter-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName, slug, siteId }),
        });
        if (!response.ok) throw new Error("Failed to create");
        toast.success("Categorie aangemaakt");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Kon categorie niet opslaan");
    } finally {
      setSavingCategory(false);
    }
  };

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

      const updatedCategory = {
        ...editingCategory,
        filters: [...editingCategory.filters, newFilter],
      };
      setEditingCategory(updatedCategory);
      onCategoryUpdated(updatedCategory);
    } catch (error) {
      console.error("Failed to add filter:", error);
      toast.error("Kon filter niet toevoegen");
    } finally {
      setAddingFilter(false);
    }
  };

  const handleDeleteFilter = async () => {
    if (!deleteTarget || !editingCategory) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/filters/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Filter verwijderd");

      const updatedFilters = editingCategory.filters.filter(
        (f) => f.id !== deleteTarget.id,
      );
      const updatedCategory = { ...editingCategory, filters: updatedFilters };
      setEditingCategory(updatedCategory);
      onCategoryUpdated(updatedCategory);
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

      const updatedCategory = { ...editingCategory, filters: newFilters };
      setEditingCategory(updatedCategory);
      onCategoryUpdated(updatedCategory);

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
      }
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filter verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; wordt permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteFilter}
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
    </>
  );
}

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
