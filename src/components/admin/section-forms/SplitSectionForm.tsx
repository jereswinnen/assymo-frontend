"use client";

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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/media/ImageUpload";
import { IconSelect } from "@/components/admin/IconSelect";
import { Separator } from "@/components/ui/separator";
import { SplitSectionSection, SplitSectionItem } from "@/types/sections";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";
import { GripVertical, Plus, Trash2, Trash2Icon } from "lucide-react";

interface SortableItemProps {
  item: SplitSectionItem;
  index: number;
  isThirdItem: boolean;
  currentSiteDomain: string | null;
  onUpdate: (updates: Partial<SplitSectionItem>) => void;
  onRemove: () => void;
}

function SortableItem({
  item,
  index,
  isThirdItem,
  currentSiteDomain,
  onUpdate,
  onRemove,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="size-4" />
          </button>
          <FieldLabel className="font-medium">Item {index + 1}</FieldLabel>
        </div>
        {isThirdItem && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2Icon className="size-4" />
            {t("admin.buttons.delete")}
          </Button>
        )}
      </div>
      <div className="p-4 space-y-4 border rounded-lg">
        <Field>
          <FieldLabel>{t("admin.labels.image")}</FieldLabel>
          <ImageUpload
            value={item.image || null}
            onChange={(value) => onUpdate({ image: value || undefined })}
          />
        </Field>

        <Field>
          <FieldLabel>{t("admin.labels.title")}</FieldLabel>
          <Input
            value={item.title || ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t("admin.placeholders.itemTitle")}
          />
        </Field>
        <Field>
          <FieldLabel>{t("admin.labels.subtitle")}</FieldLabel>
          <Input
            value={item.subtitle || ""}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder={t("admin.placeholders.optionalSubtitle")}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{t("admin.labels.openChatbot")}</FieldLabel>
          <Switch
            checked={item.actionType === "openChatbot"}
            onCheckedChange={(checked) =>
              onUpdate({
                actionType: checked ? "openChatbot" : "link",
                href: checked ? undefined : item.href,
              })
            }
          />
        </Field>

        {item.actionType !== "openChatbot" && (
          <Field>
            <FieldLabel>{t("admin.labels.linkUrl")}</FieldLabel>
            <Input
              value={item.href || ""}
              onChange={(e) => onUpdate({ href: e.target.value })}
              placeholder="/pagina"
            />
            <FieldDescription>
              {currentSiteDomain || "https://..."}
              {item.href || "/..."}
            </FieldDescription>
          </Field>
        )}

        <Separator />

        <div className="space-y-4">
          <FieldLabel>{t("admin.labels.actionOptional")}</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel className="text-muted-foreground">
                {t("admin.labels.label")}
              </FieldLabel>
              <Input
                value={item.action?.label || ""}
                onChange={(e) =>
                  onUpdate({
                    action: { ...item.action, label: e.target.value },
                  })
                }
                placeholder={t("admin.placeholders.viewMore")}
              />
            </Field>
            <Field>
              <FieldLabel className="text-muted-foreground">
                {t("admin.labels.icon")}
              </FieldLabel>
              <IconSelect
                value={item.action?.icon || ""}
                onValueChange={(value) =>
                  onUpdate({
                    action: { ...item.action, icon: value || undefined },
                  })
                }
                allowNone
              />
            </Field>
            <Field>
              <FieldLabel className="text-muted-foreground">
                {t("admin.labels.variant")}
              </FieldLabel>
              <Select
                value={item.action?.variant || "secondary"}
                onValueChange={(value) =>
                  onUpdate({
                    action: {
                      ...item.action,
                      variant: value as "primary" | "secondary",
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">
                    {t("admin.misc.primary")}
                  </SelectItem>
                  <SelectItem value="secondary">
                    {t("admin.misc.secondary")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SplitSectionFormProps {
  section: SplitSectionSection;
  onChange: (section: SplitSectionSection) => void;
}

export function SplitSectionForm({ section, onChange }: SplitSectionFormProps) {
  const { currentSite } = useSiteContext();

  // Ensure we always have at least 2 items (work with array for dnd)
  const items: SplitSectionItem[] = section.items?.filter(
    (item): item is SplitSectionItem => item !== undefined,
  ) || [{ _key: crypto.randomUUID() }, { _key: crypto.randomUUID() }];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item._key === active.id);
    const newIndex = items.findIndex((item) => item._key === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    // Convert back to tuple type
    const newItems: [SplitSectionItem, SplitSectionItem, SplitSectionItem?] =
      reordered.length === 3
        ? [reordered[0], reordered[1], reordered[2]]
        : [reordered[0], reordered[1]];

    onChange({ ...section, items: newItems });
  };

  const updateItem = (index: number, updates: Partial<SplitSectionItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };

    const tupleItems: [SplitSectionItem, SplitSectionItem, SplitSectionItem?] =
      newItems.length === 3
        ? [newItems[0], newItems[1], newItems[2]]
        : [newItems[0], newItems[1]];

    onChange({ ...section, items: tupleItems });
  };

  const addThirdItem = () => {
    const newItems: [SplitSectionItem, SplitSectionItem, SplitSectionItem] = [
      items[0],
      items[1],
      { _key: crypto.randomUUID() },
    ];
    onChange({ ...section, items: newItems });
  };

  const removeItem = (index: number) => {
    // Only allow removing if we have 3 items (keeps minimum of 2)
    if (items.length !== 3) return;
    const newItems: [SplitSectionItem, SplitSectionItem] =
      index === 0
        ? [items[1], items[2]!]
        : index === 1
          ? [items[0], items[2]!]
          : [items[0], items[1]];
    onChange({ ...section, items: newItems });
  };

  const hasThirdItem = items.length === 3;

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item._key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {items.map((item, index) => (
              <SortableItem
                key={item._key}
                item={item}
                index={index}
                isThirdItem={hasThirdItem}
                currentSiteDomain={currentSite?.domain ?? null}
                onUpdate={(updates) => updateItem(index, updates)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!hasThirdItem && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addThirdItem}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t("admin.buttons.addItem")}
        </Button>
      )}
    </div>
  );
}
