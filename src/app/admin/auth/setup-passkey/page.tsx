"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2Icon,
  AlertCircleIcon,
  FingerprintIcon,
  ArrowRightIcon,
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

      // Success - go to admin
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

  const handleSkip = () => {
    localStorage.setItem("passkey_skipped", "true");
    router.push("/admin");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="p-0 pb-6">
          <div className="flex items-center gap-2">
            <FingerprintIcon className="size-6" />
            <p className="text-2xl font-medium">Passkey toevoegen</p>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Voeg een passkey toe voor snellere en veiligere logins. Je kunt dan
            inloggen met Face ID, Touch ID of je apparaat-PIN.
          </p>
        </CardHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleAddPasskey}
            disabled={adding}
          >
            {adding ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Laden...
              </>
            ) : (
              <>
                <FingerprintIcon className="size-4" />
                Passkey toevoegen
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleSkip}
            disabled={adding}
          >
            Overslaan
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
