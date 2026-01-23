"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CopyIcon,
  GripVerticalIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import { CategoryEditSheet } from "./sheets/CategoryEditSheet";
import type { ConfiguratorCategory } from "@/lib/configurator/categories";

export default function ConfiguratorPage() {
  const router = useRouter();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");
  const [categories, setCategories] = useState<ConfiguratorCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingCategory, setEditingCategory] = useState<ConfiguratorCategory | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ConfiguratorCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicate
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!siteLoading && currentSite) {
      loadData();
    }
  }, [currentSite, siteLoading]);

  const loadData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/configurator/categories?siteId=${currentSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load configurator data:", error);
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async () => {
    if (!deleteTarget || !currentSite) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/categories/${deleteTarget.id}?siteId=${currentSite.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("admin.messages.itemDeleted"));
    } catch {
      toast.error(t("admin.messages.itemDeleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const duplicateCategory = async (category: ConfiguratorCategory) => {
    if (!currentSite) return;

    setDuplicating(category.id);
    try {
      const response = await fetch(
        `/api/admin/configurator/categories/${category.id}/duplicate?siteId=${currentSite.id}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate");
      }

      const newCategory = await response.json();
      setCategories((prev) => [...prev, newCategory]);
      toast.success(t("admin.messages.itemDuplicated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.messages.itemDuplicateFailed")
      );
    } finally {
      setDuplicating(null);
    }
  };

  // Sheet handlers
  const openNewCategorySheet = useCallback(() => {
    setEditingCategory(null);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentSite) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      try {
        await fetch("/api/admin/configurator/categories/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newCategories.map((c) => c.id),
            siteId: currentSite.id,
          }),
        });
      } catch (error) {
        console.error("Failed to reorder categories:", error);
        toast.error(t("admin.messages.orderSaveFailed"));
        loadData();
      }
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewCategorySheet}>
        <PlusIcon className="size-4" />
        {t("admin.buttons.addItem")}
      </Button>
    ),
    [openNewCategorySheet]
  );
  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  const isLoading = loading || siteLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {categories.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SettingsIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t("admin.empty.noCategories")}</EmptyTitle>
            <EmptyDescription>{t("admin.empty.noCategoriesDesc")}</EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={openNewCategorySheet}>
            <PlusIcon className="size-4" />
            {t("admin.buttons.addItem")}
          </Button>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{t("admin.labels.name")}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onRowClick={() => router.push(`/admin/content/configurator/${category.id}`)}
                    onDuplicate={() => duplicateCategory(category)}
                    onDelete={() => setDeleteTarget(category)}
                    duplicating={duplicating === category.id}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Create Sheet */}
      <CategoryEditSheet
        category={editingCategory}
        siteId={currentSite?.id}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSaved={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.misc.deleteItemQuestion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteItemDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCategory}
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
    </>
  );
}

function SortableCategoryRow({
  category,
  onRowClick,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  category: ConfiguratorCategory;
  onRowClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicating: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="cursor-pointer"
      onClick={onRowClick}
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
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              disabled={duplicating}
            >
              {duplicating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {t("admin.buttons.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon className="size-4" />
              {t("admin.buttons.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
