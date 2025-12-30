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
import { t } from "@/config/strings";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("admin.messages.fillAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("admin.messages.passwordMismatch"));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t("admin.messages.passwordMinLength"));
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
          toast.error(t("admin.messages.currentPasswordWrong"));
        } else {
          toast.error(error.message || t("admin.messages.passwordChangeFailed"));
        }
        return;
      }

      toast.success(t("admin.messages.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(t("admin.messages.errorOccurred"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FieldSet>
      <FieldLegend className="flex items-center gap-1.5 font-semibold">
        <KeyRoundIcon className="size-4 opacity-80" />
        {t("admin.labels.password")}
      </FieldLegend>

      <Field>
        <FieldLabel htmlFor="currentPassword">{t("admin.labels.currentPassword")}</FieldLabel>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="newPassword">{t("admin.labels.newPassword")}</FieldLabel>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <FieldDescription>{t("admin.dialogs.minChars")}</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="confirmPassword">{t("admin.labels.confirmNewPassword")}</FieldLabel>
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
        {t("admin.buttons.changePassword")}
      </Button>
    </FieldSet>
  );
}
