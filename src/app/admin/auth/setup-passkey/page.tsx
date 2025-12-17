"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2Icon,
  AlertCircleIcon,
  FingerprintIcon,
  CheckIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SetupPasskeyPage() {
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        // Check if user is authenticated
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/admin/auth");
          return;
        }

        // Check if user already has passkeys
        const { data: passkeys } = await authClient.passkey.listUserPasskeys();
        if (passkeys && passkeys.length > 0) {
          router.push("/admin");
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
        router.push("/admin/auth");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
    setLoading(false);
  }, [router]);

  const handleAddPasskey = async () => {
    setError(null);
    setAdding(true);

    try {
      const { error } = await authClient.passkey.addPasskey();

      if (error) {
        console.error("Add passkey error:", error);
        // Don't show error for user cancellation
        if (!error.message?.toLowerCase().includes("cancel")) {
          setError("Kon passkey niet toevoegen. Probeer opnieuw.");
        }
        return;
      }

      // Success - mark MFA choice as complete and go to admin
      await fetch("/api/admin/user/mfa-choice", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Add passkey error:", err);
      // Don't show error for AbortError (user cancelled)
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Kon passkey niet toevoegen. Probeer opnieuw.");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleSkip = async () => {
    // Mark MFA choice as complete
    await fetch("/api/admin/user/mfa-choice", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  if (loading) {
    return (
      <>
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <FingerprintIcon className="size-6 opacity-80" />
          <p className="text-2xl font-semibold tracking-tight">
            Passkey toevoegen
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Voeg een passkey toe om in te loggen met FaceID, TouchID of de
          toegangscode van je toestel.
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handleSkip} disabled={adding}>
          Overslaan
        </Button>

        <Button onClick={handleAddPasskey} disabled={adding}>
          {adding ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Laden...
            </>
          ) : (
            <>
              <CheckIcon className="size-4" />
              Bewaren
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
