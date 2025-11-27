"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2Icon, AlertCircleIcon, MailIcon } from "lucide-react";
import type { Newsletter } from "@/config/newsletter";

interface DraftsListProps {
  drafts: Newsletter[];
  selectedId?: number;
  onSelect: (draft: Newsletter) => void;
  onDelete: (id: number) => void;
}

export function DraftsList({
  drafts,
  selectedId,
  onSelect,
  onDelete,
}: DraftsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<Newsletter | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, draft: Newsletter) => {
    e.stopPropagation();
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (draftToDelete) {
      onDelete(draftToDelete.id);
    }
    setDeleteDialogOpen(false);
    setDraftToDelete(null);
  };

  if (drafts.length === 0) {
    return (
      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertDescription>
          Geen concepten gevonden. Maak een nieuwe nieuwsbrief aan om te
          beginnen.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {drafts.map((draft) => (
          <Item
            key={draft.id}
            variant="outline"
            className={
              selectedId === draft.id
                ? "ring-2 ring-primary"
                : "cursor-pointer hover:bg-muted/50"
            }
            onClick={() => onSelect(draft)}
          >
            <ItemMedia variant="icon">
              <MailIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {draft.subject || (
                  <span className="italic text-muted-foreground">
                    Geen onderwerp
                  </span>
                )}
              </ItemTitle>
              <ItemDescription className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {draft.sections.length}{" "}
                  {draft.sections.length === 1 ? "sectie" : "secties"}
                </Badge>
                <Badge variant="outline">
                  {new Date(draft.createdAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Badge>
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteClick(e, draft)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concept verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit concept wilt verwijderen? Deze actie kan
              niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2Icon className="size-4" />
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
