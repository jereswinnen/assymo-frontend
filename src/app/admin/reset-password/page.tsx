"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  KeyIcon,
  Loader2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

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
      setPageError(
        "Deze reset link is verlopen of ongeldig. Vraag een nieuwe link aan."
      );
      return;
    }

    if (!token && !urlError) {
      setPageError("Geen geldige reset link. Vraag een nieuwe link aan.");
    }
  }, [token, urlError]);

  const validateForm = (): boolean => {
    setValidationError(null);

    if (!password || !confirmPassword) {
      setValidationError("Vul beide velden in.");
      return false;
    }

    if (password.length < 8) {
      setValidationError("Wachtwoord moet minimaal 8 tekens zijn.");
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError("Wachtwoorden komen niet overeen.");
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
      setValidationError("Geen geldige reset link.");
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
          setValidationError(
            "Deze reset link is verlopen of ongeldig. Vraag een nieuwe link aan."
          );
        } else {
          setValidationError(
            error.message || "Er is iets misgegaan. Probeer het opnieuw."
          );
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setValidationError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <p className="text-2xl font-medium">Link ongeldig</p>
          </CardHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>

            <Button
              className="w-full"
              onClick={() => router.push("/admin/login")}
            >
              Terug naar inloggen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="size-6 text-green-600" />
              <p className="text-2xl font-medium">Wachtwoord gewijzigd</p>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je
              nieuwe wachtwoord.
            </p>

            <Button
              className="w-full"
              onClick={() => router.push("/admin/login")}
            >
              Naar inloggen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="p-0 pb-6">
          <p className="text-2xl font-medium">Nieuw wachtwoord</p>
          <p className="text-muted-foreground text-sm mt-1">
            Kies een nieuw wachtwoord voor je account.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nieuw wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationError(null);
              }}
              placeholder="Minimaal 8 tekens"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationError(null);
              }}
              placeholder="Herhaal je wachtwoord"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <KeyIcon className="size-4" />
                Wachtwoord opslaan
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
