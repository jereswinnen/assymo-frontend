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
  FieldDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckIcon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

export default function NavigationPage() {
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null);
  const [isNewLink, setIsNewLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkSlug, setLinkSlug] = useState("");
  const [linkSubmenuHeading, setLinkSubmenuHeading] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({
    title: "",
    slug: "",
    submenuHeading: "",
  });

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

  const subitemSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      const response = await fetch(
        "/api/admin/content/navigation?location=header",
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

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (isNewLink) {
      return linkTitle.trim().length > 0;
    }
    return (
      linkTitle !== originalValues.title ||
      linkSlug !== originalValues.slug ||
      linkSubmenuHeading !== originalValues.submenuHeading
    );
  }, [isNewLink, linkTitle, linkSlug, linkSubmenuHeading, originalValues]);

  // Sheet handlers
  const openNewLinkSheet = useCallback(() => {
    setEditingLink(null);
    setIsNewLink(true);
    setLinkTitle("");
    setLinkSlug("");
    setLinkSubmenuHeading("");
    setOriginalValues({ title: "", slug: "", submenuHeading: "" });
  }, []);

  const openEditLinkSheet = (link: NavigationLink) => {
    setEditingLink(link);
    setIsNewLink(false);
    setLinkTitle(link.title);
    setLinkSlug(link.slug);
    setLinkSubmenuHeading(link.submenu_heading || "");
    setOriginalValues({
      title: link.title,
      slug: link.slug,
      submenuHeading: link.submenu_heading || "",
    });
  };

  const closeSheet = () => {
    setEditingLink(null);
    setIsNewLink(false);
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
          },
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

      closeSheet();
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
  const handleAddSubitem = async (solutionId: string) => {
    if (!editingLink) return;

    try {
      const response = await fetch(
        `/api/admin/content/navigation/${editingLink.id}/subitems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ solution_id: solutionId }),
        },
      );
      if (!response.ok) throw new Error("Failed to add");
      toast.success("Subitem toegevoegd");

      // Refresh and update editing link
      const linksResponse = await fetch(
        "/api/admin/content/navigation?location=header",
      );
      if (linksResponse.ok) {
        const data = await linksResponse.json();
        setLinks(data);
        const updatedLink = data.find(
          (l: NavigationLink) => l.id === editingLink.id,
        );
        if (updatedLink) {
          setEditingLink(updatedLink);
        }
      }
    } catch (error) {
      console.error("Failed to add subitem:", error);
      toast.error("Kon subitem niet toevoegen");
    }
  };

  const handleDeleteSubitem = async (subitemId: string) => {
    if (!editingLink) return;

    try {
      const response = await fetch(
        `/api/admin/content/navigation/subitems/${subitemId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Subitem verwijderd");

      // Update local state
      setEditingLink({
        ...editingLink,
        sub_items: editingLink.sub_items.filter((s) => s.id !== subitemId),
      });
      setLinks((prev) =>
        prev.map((link) =>
          link.id === editingLink.id
            ? {
                ...link,
                sub_items: link.sub_items.filter((s) => s.id !== subitemId),
              }
            : link,
        ),
      );
    } catch (error) {
      console.error("Failed to delete subitem:", error);
      toast.error("Kon subitem niet verwijderen");
    }
  };

  const handleReorderSubitems = async (orderedIds: string[]) => {
    if (!editingLink) return;

    // Optimistic update
    const reorderedSubitems = orderedIds
      .map((id) => editingLink.sub_items.find((s) => s.id === id))
      .filter(Boolean) as NavigationSubitem[];

    setEditingLink({ ...editingLink, sub_items: reorderedSubitems });
    setLinks((prev) =>
      prev.map((link) =>
        link.id === editingLink.id
          ? { ...link, sub_items: reorderedSubitems }
          : link,
      ),
    );

    try {
      await fetch(`/api/admin/content/navigation/${editingLink.id}/subitems`, {
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

  const handleSubitemDragEnd = (event: DragEndEvent) => {
    if (!editingLink) return;

    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editingLink.sub_items.findIndex(
        (s) => s.id === active.id,
      );
      const newIndex = editingLink.sub_items.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(editingLink.sub_items, oldIndex, newIndex);
      handleReorderSubitems(newOrder.map((s) => s.id));
    }
  };

  // Filter out solutions already added as subitems
  const availableSolutions = editingLink
    ? solutions.filter(
        (s) => !editingLink.sub_items.some((sub) => sub.solution_id === s.id),
      )
    : solutions;

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

  const sheetOpen = !!editingLink || isNewLink;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Nog geen navigatie links</p>
          <Button size="sm" onClick={openNewLinkSheet}>
            <PlusIcon className="size-4" />
            Eerste link aanmaken
          </Button>
        </div>
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
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          side="right"
          className="px-4 w-full sm:max-w-xl overflow-y-auto"
        >
          <SheetHeader className="px-0">
            <SheetTitle>
              {editingLink ? "Link bewerken" : "Nieuwe link"}
            </SheetTitle>
            <SheetDescription>
              {editingLink
                ? "Bewerk de navigatie link en bijbehorende subitems."
                : "Maak een nieuwe navigatie link aan."}
            </SheetDescription>
          </SheetHeader>

          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="link-title">Label</FieldLabel>
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
              </Field>

              <Field>
                <FieldLabel htmlFor="link-slug">URL</FieldLabel>
                <Input
                  id="link-slug"
                  value={linkSlug}
                  onChange={(e) => setLinkSlug(e.target.value)}
                  placeholder="bijv-producten"
                />
                <FieldDescription>
                  {process.env.NEXT_PUBLIC_BASE_URL || "https://assymo.be"}/
                  {linkSlug || "..."}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="link-submenu">Submenu heading</FieldLabel>
                <Input
                  id="link-submenu"
                  value={linkSubmenuHeading}
                  onChange={(e) => setLinkSubmenuHeading(e.target.value)}
                  placeholder="Ontdek"
                />
                <FieldDescription>
                  Enkel invullen indien er subitems aanwezig zijn voor deze
                  link.
                </FieldDescription>
              </Field>
            </FieldSet>

            <Separator />

            {/* Subitems section - only show when editing existing link */}
            {editingLink && (
              <FieldSet>
                <FieldLegend variant="label">Subitems</FieldLegend>

                {availableSolutions.length > 0 && (
                  <Select onValueChange={handleAddSubitem} value="">
                    <SelectTrigger className="w-full">
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

                {editingLink.sub_items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Nog geen subitems
                  </p>
                ) : (
                  <DndContext
                    sensors={subitemSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSubitemDragEnd}
                  >
                    <SortableContext
                      items={editingLink.sub_items.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1">
                        {editingLink.sub_items.map((subitem) => (
                          <SortableSubitem
                            key={subitem.id}
                            subitem={subitem}
                            onDelete={() => handleDeleteSubitem(subitem.id)}
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
              onClick={handleSaveLink}
              disabled={savingLink || !hasChanges}
            >
              {savingLink ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  {editingLink ? "Opslaan" : "Aanmaken"}
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

// Sortable subitem component
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
      className="group flex items-center gap-2 p-2 bg-muted/50 rounded-md"
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
        className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3" />
      </Button>
    </div>
  );
}
