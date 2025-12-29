"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { toast } from "sonner";
import { KeyRoundIcon, Loader2Icon, CheckIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vul alle velden in");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Wachtwoord moet minimaal 8 tekens zijn");
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (error) {
        if (error.message?.includes("incorrect") || error.message?.includes("Invalid")) {
          toast.error("Huidig wachtwoord is onjuist");
        } else {
          toast.error(error.message || "Kon wachtwoord niet wijzigen");
        }
        return;
      }

      toast.success("Wachtwoord gewijzigd");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Er is een fout opgetreden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FieldSet>
      <FieldLegend className="flex items-center gap-1.5 font-semibold">
        <KeyRoundIcon className="size-4 opacity-80" />
        Wachtwoord
      </FieldLegend>

      <Field>
        <FieldLabel htmlFor="currentPassword">Huidig wachtwoord</FieldLabel>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="newPassword">Nieuw wachtwoord</FieldLabel>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <FieldDescription>Minimaal 8 tekens</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="confirmPassword">Bevestig nieuw wachtwoord</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>

      <Button
        onClick={handleChangePassword}
        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
        className="w-fit"
      >
        {saving ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        Wachtwoord wijzigen
      </Button>
    </FieldSet>
  );
}
