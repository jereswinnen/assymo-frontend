"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  ImageIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { t } from "@/config/strings";

interface Solution {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: { url: string; alt?: string } | null;
  order_rank: number;
  updated_at: string;
}

function SortableSolutionRow({
  solution,
  onRowClick,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  solution: Solution;
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
  } = useSortable({ id: solution.id });

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
      <TableCell className="w-12">
        {solution.header_image?.url ? (
          <div className="relative size-10 shrink-0 overflow-hidden rounded">
            <Image
              src={solution.header_image.url}
              alt={solution.header_image.alt || solution.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
            <ImageIcon className="size-4 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{solution.name}</TableCell>
      <TableCell className="hidden sm:table-cell text-muted-foreground">
        /realisaties/{solution.slug}
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {formatDateShort(solution.updated_at)}
      </TableCell>
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

export default function SolutionsPage() {
  const router = useRouter();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Solution | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicate
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!siteLoading && currentSite) {
      fetchSolutions();
    }
  }, [currentSite, siteLoading]);

  const fetchSolutions = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content/solutions?siteId=${currentSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSolutions(data);
    } catch {
      toast.error(t("admin.messages.solutionsLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const createSolution = useCallback(async () => {
    if (!currentSite) return;
    setCreating(true);
    try {
      const response = await fetch("/api/admin/content/solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nieuwe realisatie",
          slug: `nieuwe-realisatie-${Date.now()}`,
          siteId: currentSite.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create");
      }

      const newSolution = await response.json();
      router.push(`/admin/content/solutions/${newSolution.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.messages.solutionSaveFailed"),
      );
      setCreating(false);
    }
  }, [router, currentSite]);

  const deleteSolution = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/solutions/${deleteTarget.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to delete");

      setSolutions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("admin.messages.solutionDeleted"));
    } catch {
      toast.error(t("admin.messages.solutionDeleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const duplicateSolution = async (solution: Solution) => {
    setDuplicating(solution.id);
    try {
      const response = await fetch(
        `/api/admin/content/solutions/${solution.id}/duplicate`,
        { method: "POST" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate");
      }

      const newSolution = await response.json();
      setSolutions((prev) => [...prev, newSolution]);
      toast.success(t("admin.messages.solutionDuplicated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.misc.solutionCouldNotDuplicate"),
      );
    } finally {
      setDuplicating(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !currentSite) return;

    const oldIndex = solutions.findIndex((s) => s.id === active.id);
    const newIndex = solutions.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(solutions, oldIndex, newIndex);
    setSolutions(newOrder);

    // Save new order
    try {
      const response = await fetch("/api/admin/content/solutions/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id), siteId: currentSite.id }),
      });

      if (!response.ok) throw new Error("Failed to reorder");
    } catch {
      // Revert on error
      setSolutions(solutions);
      toast.error(t("admin.messages.orderSaveFailed"));
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={createSolution} disabled={creating}>
        {creating ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <PlusIcon className="size-4" />
        )}
        {t("admin.misc.newSolution")}
      </Button>
    ),
    [createSolution, creating],
  );
  useAdminHeaderActions(headerActions);

  const isLoading = loading || siteLoading;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : solutions.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t("admin.misc.noSolutionsYet")}</EmptyTitle>
            <EmptyDescription>
              {t("admin.misc.noSolutionsDesc")}
            </EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={createSolution} disabled={creating}>
            {creating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            {t("admin.misc.createSolution")}
          </Button>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={solutions.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{t("admin.labels.name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">URL</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("admin.misc.lastEdited")}
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solutions.map((solution) => (
                  <SortableSolutionRow
                    key={solution.id}
                    solution={solution}
                    onRowClick={() =>
                      router.push(`/admin/content/solutions/${solution.id}`)
                    }
                    onDuplicate={() => duplicateSolution(solution)}
                    onDelete={() => setDeleteTarget(solution)}
                    duplicating={duplicating === solution.id}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
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
