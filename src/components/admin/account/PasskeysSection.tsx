"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { toast } from "sonner";
import {
  FingerprintIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface Passkey {
  id: string;
  name?: string;
  createdAt: Date;
}

export function PasskeysSection() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      const { data } = await authClient.passkey.listUserPasskeys();
      if (data) setPasskeys(data);
    } catch (err) {
      console.error("Failed to load passkeys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    setAddingPasskey(true);
    try {
      const { error } = await authClient.passkey.addPasskey();
      if (error) {
        if (!error.message?.toLowerCase().includes("cancel")) {
          toast.error("Kon passkey niet toevoegen");
        }
        return;
      }
      toast.success("Passkey toegevoegd");
      loadPasskeys();
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Kon passkey niet toevoegen");
      }
    } finally {
      setAddingPasskey(false);
    }
  };

  const openDeleteDialog = (passkey: Passkey) => {
    setPasskeyToDelete(passkey);
    setDeleteDialogOpen(true);
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;

    setDeletingPasskeyId(passkeyToDelete.id);
    try {
      const { error } = await authClient.passkey.deletePasskey({
        id: passkeyToDelete.id,
      });
      if (error) {
        toast.error("Kon passkey niet verwijderen");
        return;
      }
      toast.success("Passkey verwijderd");
      setPasskeys((prev) => prev.filter((p) => p.id !== passkeyToDelete.id));
      setDeleteDialogOpen(false);
      setPasskeyToDelete(null);
    } catch (err) {
      console.error("Failed to delete passkey:", err);
      toast.error("Kon passkey niet verwijderen");
    } finally {
      setDeletingPasskeyId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <FingerprintIcon className="size-4 opacity-80" />
          Passkeys
        </FieldLegend>
        <div className="flex items-center justify-center py-4">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      </FieldSet>
    );
  }

  return (
    <>
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <FingerprintIcon className="size-4 opacity-80" />
          Passkeys
        </FieldLegend>
        <FieldDescription>
          Log sneller in met Face ID, Touch ID of de toegangscode van je toestel.
        </FieldDescription>

        <div className="space-y-4">
          {passkeys.length > 0 ? (
            <div className="p-3 space-y-4 border border-border rounded-lg">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {passkey.name || "Passkey"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Toegevoegd op {formatDate(passkey.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(passkey)}
                    disabled={deletingPasskeyId === passkey.id}
                  >
                    {deletingPasskeyId === passkey.id ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                    Verwijderen
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Geen passkeys geregistreerd
            </p>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddPasskey}
            disabled={addingPasskey}
            className="w-fit"
          >
            {addingPasskey ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            Passkey toevoegen
          </Button>
        </div>
      </FieldSet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passkey verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze passkey wilt verwijderen? Je kunt dan
              niet meer inloggen met deze passkey.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingPasskeyId}
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeletePasskey}
              disabled={!!deletingPasskeyId}
            >
              {deletingPasskeyId ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Verwijderen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
