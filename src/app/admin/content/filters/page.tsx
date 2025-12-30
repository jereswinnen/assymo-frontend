"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { useSiteContext } from "@/lib/permissions/site-context";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { toast } from "sonner";
import {
  FilterIcon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { FilterCategorySheet } from "./sheets/FilterCategorySheet";

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

export default function FiltersPage() {
  const { currentSite, loading: siteLoading } = useSiteContext();
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingCategory, setEditingCategory] = useState<FilterCategory | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  // Delete confirmation state (for categories only - filter deletion is handled in sheet)
  const [deleteTarget, setDeleteTarget] = useState<{
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

  useEffect(() => {
    if (!siteLoading && currentSite) {
      fetchCategories();
    }
  }, [currentSite, siteLoading]);

  const fetchCategories = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/content/filter-categories?siteId=${currentSite.id}`,
      );
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

  // Sheet handlers
  const openNewCategorySheet = useCallback(() => {
    setEditingCategory(null);
    setSheetOpen(true);
  }, []);

  const openEditCategorySheet = (category: FilterCategory) => {
    setEditingCategory(category);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  };

  const handleCategoryUpdated = (updatedCategory: FilterCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)),
    );
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/filter-categories/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Categorie verwijderd");
      if (editingCategory?.id === deleteTarget.id) {
        setSheetOpen(false);
        setEditingCategory(null);
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

    if (over && active.id !== over.id && currentSite) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      try {
        await fetch("/api/admin/content/filter-categories/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newCategories.map((c) => c.id),
            siteId: currentSite.id,
          }),
        });
      } catch (error) {
        console.error("Failed to reorder categories:", error);
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

  const isLoading = loading || siteLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilterIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Nog geen categorieën</EmptyTitle>
            <EmptyDescription>
              Maak je eerste categorie aan om filters te organiseren.
            </EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={openNewCategorySheet}>
            <PlusIcon className="size-4" />
            Categorie aanmaken
          </Button>
        </Empty>
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
      <FilterCategorySheet
        category={editingCategory}
        siteId={currentSite?.id}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSaved={fetchCategories}
        onCategoryUpdated={handleCategoryUpdated}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Categorie verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; en alle bijbehorende filters
              worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCategory}
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
