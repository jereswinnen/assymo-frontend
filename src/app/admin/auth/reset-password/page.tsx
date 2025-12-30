"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Loader2Icon,
  AlertCircleIcon,
  KeyRoundIcon,
  CheckIcon,
  UnlinkIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { t } from "@/config/strings";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  useEffect(() => {
    // Check for error parameter from Better Auth (invalid/expired token)
    if (urlError === "INVALID_TOKEN") {
      setPageError(t("admin.dialogs.resetLinkExpired"));
      return;
    }

    if (!token && !urlError) {
      setPageError(t("admin.dialogs.noValidResetLink"));
    }
  }, [token, urlError]);

  const validateForm = (): boolean => {
    setValidationError(null);

    if (!password || !confirmPassword) {
      setValidationError(t("admin.messages.fillBothFields"));
      return false;
    }

    if (password.length < 8) {
      setValidationError(t("admin.messages.passwordMinLengthWithPeriod"));
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError(t("admin.messages.passwordMismatchWithPeriod"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setValidationError(t("admin.dialogs.noValidResetLinkShort"));
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        console.error("Reset password error:", error);
        // Handle specific error codes
        if (
          error.message?.toLowerCase().includes("invalid") ||
          error.message?.toLowerCase().includes("expired")
        ) {
          setValidationError(t("admin.dialogs.resetLinkExpired"));
        } else {
          setValidationError(
            error.message || t("admin.messages.somethingWentWrong"),
          );
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setValidationError(t("admin.messages.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  if (pageError) {
    return (
      <div className="w-full max-w-lg space-y-6">
        <header className="flex items-center gap-2">
          <UnlinkIcon className="size-6 opacity-80" />
          <p className="text-2xl font-semibold tracking-tight">{t("admin.headings.linkInvalid")}</p>
        </header>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>

          <Button onClick={() => router.push("/admin/auth")}>
            {t("admin.buttons.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-lg space-y-6">
        <header className="flex items-center gap-2">
          <KeyRoundIcon className="size-6 opacity-80" />
          <p className="text-2xl font-semibold tracking-tight">
            {t("admin.headings.passwordChanged")}
          </p>
        </header>

        <p className="text-muted-foreground">
          {t("admin.dialogs.passwordSuccessfullyChanged")}
        </p>
        <Button onClick={() => router.push("/admin/auth")}>
          {t("admin.buttons.goToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <header className="flex items-center gap-2">
        <KeyRoundIcon className="size-6 opacity-80" />
        <p className="text-2xl font-semibold tracking-tight">
          {t("admin.headings.newPassword")}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">{t("admin.labels.password")}</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationError(null);
              }}
              placeholder="••••••••"
              disabled={loading}
              autoFocus
            />
            <FieldDescription>{t("admin.dialogs.minChars")}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("admin.labels.confirmPassword")}
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationError(null);
              }}
              placeholder="••••••••"
              disabled={loading}
            />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={loading || !password || !confirmPassword}
        >
          {loading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t("admin.loading.saving")}
            </>
          ) : (
            <>
              <CheckIcon className="size-4" />
              {t("admin.buttons.save")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <>
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
