"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { t } from "@/config/strings";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (folder: { id: string; name: string; siteId?: string | null }) => void;
  siteId?: string;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onCreated,
  siteId,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t("admin.messages.nameRequired"));
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/content/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), siteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("admin.messages.somethingWentWrongShort"));
        setCreating(false);
        return;
      }

      onCreated({ id: data.id, name: data.name, siteId: data.siteId });
      setName("");
      onOpenChange(false);
    } catch {
      setError(t("admin.messages.somethingWentWrongShort"));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("admin.headings.newFolder")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">{t("admin.labels.name")}</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t("admin.placeholders.folderName")}
              autoFocus
              className="mt-2"
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={creating}
            >
              {t("admin.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.buttons.creating")}
                </>
              ) : (
                t("admin.buttons.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
