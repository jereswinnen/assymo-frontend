"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  CopyIcon,
  GripVerticalIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";

interface Solution {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: { url: string; alt?: string } | null;
  order_rank: number;
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


function SortableSolutionItem({
  solution,
  onEdit,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  solution: Solution;
  onEdit: () => void;
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
    <Card ref={setNodeRef} style={style} className="hover:bg-muted/50 transition-colors">
      <CardContent className="flex items-center gap-4 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVerticalIcon className="size-5" />
        </button>

        {solution.header_image?.url ? (
          <div className="relative size-12 shrink-0 overflow-hidden rounded">
            <Image
              src={solution.header_image.url}
              alt={solution.header_image.alt || solution.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded bg-muted">
            <ImageIcon className="size-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{solution.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            /{solution.slug}
            {solution.subtitle && ` • ${solution.subtitle}`}
          </p>
        </div>

        <p className="text-sm text-muted-foreground shrink-0 hidden sm:block">
          {formatDateShort(solution.updated_at)}
        </p>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            disabled={duplicating}
            title="Dupliceren"
          >
            {duplicating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  // New solution dialog
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Solution | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicate
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/solutions");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSolutions(data);
    } catch {
      toast.error("Kon realisaties niet ophalen");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setNewName(value);
    if (autoSlug) {
      setNewSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setNewSlug(value);
    setAutoSlug(false);
  };

  const openNewDialog = useCallback(() => {
    setNewName("");
    setNewSlug("");
    setAutoSlug(true);
    setIsNewDialogOpen(true);
  }, []);

  const createSolution = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      toast.error("Naam en slug zijn verplicht");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/content/solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create");
      }

      const newSolution = await response.json();
      setSolutions((prev) => [...prev, newSolution]);
      setIsNewDialogOpen(false);
      toast.success("Realisatie aangemaakt");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon realisatie niet aanmaken"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSolution = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/solutions/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setSolutions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Realisatie verwijderd");
    } catch {
      toast.error("Kon realisatie niet verwijderen");
    } finally {
      setDeleting(false);
    }
  };

  const duplicateSolution = async (solution: Solution) => {
    setDuplicating(solution.id);
    try {
      const response = await fetch(
        `/api/admin/content/solutions/${solution.id}/duplicate`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate");
      }

      const newSolution = await response.json();
      setSolutions((prev) => [...prev, newSolution]);
      toast.success("Realisatie gedupliceerd");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon realisatie niet dupliceren"
      );
    } finally {
      setDuplicating(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = solutions.findIndex((s) => s.id === active.id);
    const newIndex = solutions.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(solutions, oldIndex, newIndex);
    setSolutions(newOrder);

    // Save new order
    try {
      const response = await fetch("/api/admin/content/solutions/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
      });

      if (!response.ok) throw new Error("Failed to reorder");
    } catch {
      // Revert on error
      setSolutions(solutions);
      toast.error("Kon volgorde niet opslaan");
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button onClick={openNewDialog}>
        <PlusIcon className="size-4" />
        Nieuwe realisatie
      </Button>
    ),
    [openNewDialog]
  );
  useAdminHeaderActions(headerActions);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : solutions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nog geen realisaties</p>
            <Button size="sm" onClick={openNewDialog}>
              <PlusIcon className="size-4" />
              Eerste realisatie aanmaken
            </Button>
          </CardContent>
        </Card>
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
            <div className="space-y-2">
              {solutions.map((solution) => (
                <SortableSolutionItem
                  key={solution.id}
                  solution={solution}
                  onEdit={() => {
                    window.location.href = `/admin/content/solutions/${solution.id}`;
                  }}
                  onDuplicate={() => duplicateSolution(solution)}
                  onDelete={() => setDeleteTarget(solution)}
                  duplicating={duplicating === solution.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* New Solution Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe realisatie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Realisatie naam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={newSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="realisatie-slug"
              />
              <p className="text-xs text-muted-foreground">
                URL: /oplossingen/{newSlug || "..."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewDialogOpen(false)}
              disabled={saving}
            >
              Annuleren
            </Button>
            <Button onClick={createSolution} disabled={saving || !newName.trim()}>
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                "Aanmaken"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Realisatie verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{deleteTarget?.name}&quot; wilt
              verwijderen? Dit kan niet ongedaan worden gemaakt.
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
