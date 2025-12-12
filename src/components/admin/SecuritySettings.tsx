"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2Icon,
  ShieldCheckIcon,
  FingerprintIcon,
  TrashIcon,
  PlusIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface Passkey {
  id: string;
  name?: string;
  createdAt: Date;
}

export function SecuritySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);

  const loadPasskeys = async () => {
    try {
      const { data } = await authClient.passkey.listUserPasskeys();
      if (data) {
        setPasskeys(data);
      }
    } catch (err) {
      console.error("Failed to load passkeys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    setAdding(true);
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
      setAdding(false);
    }
  };

  const openDeleteDialog = (passkey: Passkey) => {
    setPasskeyToDelete(passkey);
    setDeleteDialogOpen(true);
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;

    setDeletingId(passkeyToDelete.id);
    try {
      const { error } = await authClient.passkey.deletePasskey({ id: passkeyToDelete.id });
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
      setDeletingId(null);
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
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      {/* 2FA Status */}
      <div className="space-y-2">
        <h3 className="font-medium flex items-center gap-2">
          <ShieldCheckIcon className="size-4" />
          Tweestapsverificatie
        </h3>
        <p className="text-sm text-muted-foreground">
          2FA is ingeschakeld voor je account. Dit is verplicht voor alle admin
          gebruikers.
        </p>
      </div>

      {/* Passkeys */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <FingerprintIcon className="size-4" />
          Passkeys
        </h3>
        <p className="text-sm text-muted-foreground">
          Log sneller in met Face ID, Touch ID of je apparaat-PIN.
        </p>

        {passkeys.length > 0 ? (
          <div className="space-y-2">
            {passkeys.map((passkey) => (
              <Card key={passkey.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {passkey.name || "Passkey"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Toegevoegd op {formatDate(passkey.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(passkey)}
                  disabled={deletingId === passkey.id}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Geen passkeys geregistreerd
          </p>
        )}

        <Button
          variant="outline"
          onClick={handleAddPasskey}
          disabled={adding}
          className="w-full"
        >
          {adding ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          Passkey toevoegen
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
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
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingId}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePasskey}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Verwijderen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
