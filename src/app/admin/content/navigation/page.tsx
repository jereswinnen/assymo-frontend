"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Sortable Navigation Link Item
function SortableLinkItem({
  link,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSubitem,
  onDeleteSubitem,
  onReorderSubitems,
  solutions,
}: {
  link: NavigationLink;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubitem: (solutionId: string) => void;
  onDeleteSubitem: (subitemId: string) => void;
  onReorderSubitems: (orderedIds: string[]) => void;
  solutions: Solution[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubitemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = link.sub_items.findIndex((s) => s.id === active.id);
      const newIndex = link.sub_items.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(link.sub_items, oldIndex, newIndex);
      onReorderSubitems(newOrder.map((s) => s.id));
    }
  };

  // Filter out solutions already added as subitems
  const availableSolutions = solutions.filter(
    (s) => !link.sub_items.some((sub) => sub.solution_id === s.id)
  );

  return (
    <Card ref={setNodeRef} style={style} className="mb-2">
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVerticalIcon className="size-4 text-muted-foreground" />
        </button>
        <button onClick={onToggleExpand} className="p-1">
          {isExpanded ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{link.title}</p>
          <p className="text-xs text-muted-foreground">
            /{link.slug} · {link.sub_items.length} subitem
            {link.sub_items.length !== 1 && "s"}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="size-8" onClick={onEdit}>
          <PencilIcon className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 border-t">
          <div className="space-y-3 mt-3">
            {link.submenu_heading && (
              <p className="text-sm text-muted-foreground">
                Submenu heading: <span className="font-medium">{link.submenu_heading}</span>
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Subitems (solutions)</Label>
                {availableSolutions.length > 0 && (
                  <Select onValueChange={onAddSubitem}>
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue placeholder="Voeg solution toe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSolutions.map((solution) => (
                        <SelectItem key={solution.id} value={solution.id}>
                          {solution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {link.sub_items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nog geen subitems
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSubitemDragEnd}
                >
                  <SortableContext
                    items={link.sub_items.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {link.sub_items.map((subitem) => (
                        <SortableSubitem
                          key={subitem.id}
                          subitem={subitem}
                          onDelete={() => onDeleteSubitem(subitem.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Sortable Subitem
function SortableSubitem({
  subitem,
  onDelete,
}: {
  subitem: NavigationSubitem;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subitem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVerticalIcon className="size-3 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm truncate">
        {subitem.solution?.name || "Unknown solution"}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  );
}

export default function NavigationPage() {
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkSlug, setLinkSlug] = useState("");
  const [linkSubmenuHeading, setLinkSubmenuHeading] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSolutions();
    fetchLinks();
  }, []);

  const fetchSolutions = async () => {
    try {
      const response = await fetch("/api/admin/content/solutions");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSolutions(data);
    } catch (error) {
      console.error("Failed to fetch solutions:", error);
    }
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/navigation?location=header");
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

  // Link handlers
  const openNewLinkDialog = () => {
    setEditingLink(null);
    setLinkTitle("");
    setLinkSlug("");
    setLinkSubmenuHeading("");
    setLinkDialogOpen(true);
  };

  const openEditLinkDialog = (link: NavigationLink) => {
    setEditingLink(link);
    setLinkTitle(link.title);
    setLinkSlug(link.slug);
    setLinkSubmenuHeading(link.submenu_heading || "");
    setLinkDialogOpen(true);
  };

  const handleSaveLink = async () => {
    if (!linkTitle.trim()) {
      toast.error("Titel is verplicht");
      return;
    }

    setSavingLink(true);
    try {
      const slug = linkSlug || slugify(linkTitle);

      if (editingLink) {
        const response = await fetch(
          `/api/admin/content/navigation/${editingLink.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: linkTitle,
              slug,
              submenu_heading: linkSubmenuHeading || null,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to update");
        toast.success("Link bijgewerkt");
      } else {
        const response = await fetch("/api/admin/content/navigation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "header",
            title: linkTitle,
            slug,
            submenu_heading: linkSubmenuHeading || null,
          }),
        });
        if (!response.ok) throw new Error("Failed to create");
        toast.success("Link aangemaakt");
      }

      setLinkDialogOpen(false);
      fetchLinks();
    } catch (error) {
      console.error("Failed to save link:", error);
      toast.error("Kon link niet opslaan");
    } finally {
      setSavingLink(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(
        `/api/admin/content/navigation/${deleteTarget.id}`,
        { method: "DELETE" }
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

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);

      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      try {
        await fetch("/api/admin/content/navigation/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: newLinks.map((l) => l.id) }),
        });
      } catch (error) {
        console.error("Failed to reorder links:", error);
        toast.error("Kon volgorde niet opslaan");
        fetchLinks();
      }
    }
  };

  // Subitem handlers
  const handleAddSubitem = async (linkId: string, solutionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/content/navigation/${linkId}/subitems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ solution_id: solutionId }),
        }
      );
      if (!response.ok) throw new Error("Failed to add");
      toast.success("Subitem toegevoegd");
      fetchLinks();
    } catch (error) {
      console.error("Failed to add subitem:", error);
      toast.error("Kon subitem niet toevoegen");
    }
  };

  const handleDeleteSubitem = async (subitemId: string) => {
    try {
      const response = await fetch(
        `/api/admin/content/navigation/subitems/${subitemId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Subitem verwijderd");
      fetchLinks();
    } catch (error) {
      console.error("Failed to delete subitem:", error);
      toast.error("Kon subitem niet verwijderen");
    }
  };

  const handleReorderSubitems = async (linkId: string, orderedIds: string[]) => {
    // Optimistic update
    setLinks((prev) =>
      prev.map((link) => {
        if (link.id !== linkId) return link;
        const reorderedSubitems = orderedIds
          .map((id) => link.sub_items.find((s) => s.id === id))
          .filter(Boolean) as NavigationSubitem[];
        return { ...link, sub_items: reorderedSubitems };
      })
    );

    try {
      await fetch(`/api/admin/content/navigation/${linkId}/subitems`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (error) {
      console.error("Failed to reorder subitems:", error);
      toast.error("Kon volgorde niet opslaan");
      fetchLinks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openNewLinkDialog}>
          <PlusIcon className="size-4" />
          Nieuwe link
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nog geen navigatie links
        </p>
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
            {links.map((link) => (
              <SortableLinkItem
                key={link.id}
                link={link}
                isExpanded={expandedLinkId === link.id}
                onToggleExpand={() =>
                  setExpandedLinkId(expandedLinkId === link.id ? null : link.id)
                }
                onEdit={() => openEditLinkDialog(link)}
                onDelete={() =>
                  setDeleteTarget({ id: link.id, title: link.title })
                }
                onAddSubitem={(solutionId) =>
                  handleAddSubitem(link.id, solutionId)
                }
                onDeleteSubitem={handleDeleteSubitem}
                onReorderSubitems={(orderedIds) =>
                  handleReorderSubitems(link.id, orderedIds)
                }
                solutions={solutions}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Link bewerken" : "Nieuwe link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Titel</Label>
              <Input
                id="link-title"
                value={linkTitle}
                onChange={(e) => {
                  setLinkTitle(e.target.value);
                  if (!editingLink) {
                    setLinkSlug(slugify(e.target.value));
                  }
                }}
                placeholder="Bijv. Producten"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-slug">Slug (URL)</Label>
              <Input
                id="link-slug"
                value={linkSlug}
                onChange={(e) => setLinkSlug(e.target.value)}
                placeholder="bijv-producten"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-submenu">Submenu heading (optioneel)</Label>
              <Input
                id="link-submenu"
                value={linkSubmenuHeading}
                onChange={(e) => setLinkSubmenuHeading(e.target.value)}
                placeholder="Bijv. Onze producten"
              />
              <p className="text-xs text-muted-foreground">
                Wordt getoond boven de subitems in het dropdown menu
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveLink} disabled={savingLink}>
              {savingLink && <Loader2Icon className="size-4 animate-spin" />}
              {editingLink ? "Opslaan" : "Aanmaken"}
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
            <AlertDialogTitle>Link verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; en alle bijbehorende subitems worden
              permanent verwijderd.
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
