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
import { toast } from "sonner";
import {
  GripVerticalIcon,
  Loader2Icon,
  MenuIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { NavLinkEditSheet } from "./sheets/NavLinkEditSheet";

interface Solution {
  id: string;
  name: string;
  slug: string;
}

interface NavigationSubitem {
  id: string;
  solution_id: string;
  order_rank: number;
  solution: Solution | null;
}

interface NavigationLink {
  id: string;
  location: "header" | "footer";
  title: string;
  slug: string;
  submenu_heading: string | null;
  order_rank: number;
  sub_items: NavigationSubitem[];
}

export default function NavigationPage() {
  const { currentSite, loading: siteLoading } = useSiteContext();
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!siteLoading && currentSite) {
      fetchSolutions();
      fetchLinks();
    }
  }, [currentSite, siteLoading]);

  const fetchSolutions = async () => {
    if (!currentSite) return;
    try {
      const response = await fetch(
        `/api/admin/content/solutions?siteId=${currentSite.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSolutions(data);
    } catch (error) {
      console.error("Failed to fetch solutions:", error);
    }
  };

  const fetchLinks = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/content/navigation?location=header&siteId=${currentSite.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      console.error("Failed to fetch navigation:", error);
      toast.error("Kon navigatie niet laden");
    } finally {
      setLoading(false);
    }
  };

  // Sheet handlers
  const openNewLinkSheet = useCallback(() => {
    setEditingLink(null);
    setSheetOpen(true);
  }, []);

  const openEditLinkSheet = (link: NavigationLink) => {
    setEditingLink(link);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingLink(null);
    }
  };

  const handleLinkUpdated = (updatedLink: NavigationLink) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === updatedLink.id ? updatedLink : l)),
    );
  };

  const handleDeleteLink = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(
        `/api/admin/content/navigation/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Link verwijderd");
      fetchLinks();
    } catch (error) {
      console.error("Failed to delete link:", error);
      toast.error("Kon link niet verwijderen");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLinkDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentSite) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);

      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      try {
        await fetch("/api/admin/content/navigation/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newLinks.map((l) => l.id),
            siteId: currentSite.id,
          }),
        });
      } catch (error) {
        console.error("Failed to reorder links:", error);
        toast.error("Kon volgorde niet opslaan");
        fetchLinks();
      }
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewLinkSheet}>
        <PlusIcon className="size-4" />
        Nieuwe link
      </Button>
    ),
    [openNewLinkSheet],
  );
  useAdminHeaderActions(headerActions);

  const isLoading = loading || siteLoading;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MenuIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Nog geen navigatie links</EmptyTitle>
            <EmptyDescription>
              Maak je eerste link aan om de navigatie te configureren.
            </EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={openNewLinkSheet}>
            <PlusIcon className="size-4" />
            Link aanmaken
          </Button>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleLinkDragEnd}
        >
          <SortableContext
            items={links.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead className="hidden sm:table-cell">URL</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Subitems
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <SortableRow
                    key={link.id}
                    id={link.id}
                    onClick={() => openEditLinkSheet(link)}
                    onDelete={() =>
                      setDeleteTarget({ id: link.id, title: link.title })
                    }
                  >
                    <TableCell className="font-medium">{link.title}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      /{link.slug}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {link.sub_items.length} subitem
                      {link.sub_items.length !== 1 && "s"}
                    </TableCell>
                  </SortableRow>
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Create Sheet */}
      <NavLinkEditSheet
        link={editingLink}
        siteId={currentSite?.id}
        solutions={solutions}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSaved={fetchLinks}
        onLinkUpdated={handleLinkUpdated}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; en alle bijbehorende subitems
              worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteLink}
            >
              Verwijderen
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
