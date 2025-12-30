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
  FieldDescription,
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

interface NavLinkEditSheetProps {
  link: NavigationLink | null;
  siteId: string | undefined;
  solutions: Solution[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onLinkUpdated: (link: NavigationLink) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function NavLinkEditSheet({
  link,
  siteId,
  solutions,
  open,
  onOpenChange,
  onSaved,
  onLinkUpdated,
}: NavLinkEditSheetProps) {
  const isNew = !link;

  // Link form state
  const [linkTitle, setLinkTitle] = useState("");
  const [linkSlug, setLinkSlug] = useState("");
  const [linkSubmenuHeading, setLinkSubmenuHeading] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    title: "",
    slug: "",
    submenuHeading: "",
  });

  // Editing link state (with subitems)
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null);

  const subitemSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Initialize form when sheet opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && link) {
      setLinkTitle(link.title);
      setLinkSlug(link.slug);
      setLinkSubmenuHeading(link.submenu_heading || "");
      setOriginalValues({
        title: link.title,
        slug: link.slug,
        submenuHeading: link.submenu_heading || "",
      });
      setEditingLink(link);
    } else if (newOpen && !link) {
      setLinkTitle("");
      setLinkSlug("");
      setLinkSubmenuHeading("");
      setOriginalValues({ title: "", slug: "", submenuHeading: "" });
      setEditingLink(null);
    }
    onOpenChange(newOpen);
  };

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (isNew) {
      return linkTitle.trim().length > 0;
    }
    return (
      linkTitle !== originalValues.title ||
      linkSlug !== originalValues.slug ||
      linkSubmenuHeading !== originalValues.submenuHeading
    );
  }, [isNew, linkTitle, linkSlug, linkSubmenuHeading, originalValues]);

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
        if (!siteId) return;
        const response = await fetch("/api/admin/content/navigation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "header",
            title: linkTitle,
            slug,
            submenu_heading: linkSubmenuHeading || null,
            siteId,
          }),
        });
        if (!response.ok) throw new Error("Failed to create");
        toast.success("Link aangemaakt");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Failed to save link:", error);
      toast.error("Kon link niet opslaan");
    } finally {
      setSavingLink(false);
    }
  };

  // Subitem handlers
  const handleAddSubitem = async (solutionId: string) => {
    if (!editingLink || !siteId) return;

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
        `/api/admin/content/navigation?location=header&siteId=${siteId}`,
      );
      if (linksResponse.ok) {
        const data = await linksResponse.json();
        const updatedLink = data.find(
          (l: NavigationLink) => l.id === editingLink.id,
        );
        if (updatedLink) {
          setEditingLink(updatedLink);
          onLinkUpdated(updatedLink);
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
      const updatedLink = {
        ...editingLink,
        sub_items: editingLink.sub_items.filter((s) => s.id !== subitemId),
      };
      setEditingLink(updatedLink);
      onLinkUpdated(updatedLink);
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

    const updatedLink = { ...editingLink, sub_items: reorderedSubitems };
    setEditingLink(updatedLink);
    onLinkUpdated(updatedLink);

    try {
      await fetch(`/api/admin/content/navigation/${editingLink.id}/subitems`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (error) {
      console.error("Failed to reorder subitems:", error);
      toast.error("Kon volgorde niet opslaan");
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="px-4 w-full md:max-w-xl overflow-y-auto"
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
                Enkel invullen indien er subitems aanwezig zijn voor deze link.
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
          <Button onClick={handleSaveLink} disabled={savingLink || !hasChanges}>
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
  );
}

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
