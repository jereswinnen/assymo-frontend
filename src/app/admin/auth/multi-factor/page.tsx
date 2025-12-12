"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Loader2Icon,
  ShieldCheckIcon,
  FingerprintIcon,
  ArrowRightIcon,
  KeyIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function MultiFactorChoicePage() {
  const [loading, setLoading] = useState(true);
  const [skipping, setSkipping] = useState(false);
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

        // If user already completed MFA choice, go to admin
        const user = session.data.user as { mfaChoiceCompleted?: boolean };
        if (user.mfaChoiceCompleted) {
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

  const handleSetupOTP = () => {
    router.push("/admin/auth/setup-2fa");
  };

  const handleSetupPasskey = () => {
    router.push("/admin/auth/setup-passkey");
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Mark MFA choice as completed
      const response = await fetch("/api/admin/user/mfa-choice", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to update MFA choice");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Skip MFA error:", err);
      // Still redirect even if API fails
      router.push("/admin");
      router.refresh();
    } finally {
      setSkipping(false);
    }
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
            <ShieldCheckIcon className="size-6" />
            <p className="text-2xl font-medium">Extra beveiliging</p>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Versterk de beveiliging van je account met tweestapsverificatie of een passkey.
            Je kunt dit later altijd nog instellen via instellingen.
          </p>
        </CardHeader>

        <div className="space-y-3">
          <Button
            className="w-full justify-start h-auto py-4"
            variant="outline"
            onClick={handleSetupOTP}
          >
            <div className="flex items-start gap-3">
              <KeyIcon className="size-5 mt-0.5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Authenticator app (OTP)</p>
                <p className="text-sm text-muted-foreground font-normal">
                  Gebruik een app zoals Google Authenticator of 1Password
                </p>
              </div>
            </div>
          </Button>

          <Button
            className="w-full justify-start h-auto py-4"
            variant="outline"
            onClick={handleSetupPasskey}
          >
            <div className="flex items-start gap-3">
              <FingerprintIcon className="size-5 mt-0.5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Passkey</p>
                <p className="text-sm text-muted-foreground font-normal">
                  Log in met Face ID, Touch ID of je apparaat-PIN
                </p>
              </div>
            </div>
          </Button>

          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleSkip}
              disabled={skipping}
            >
              {skipping ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Laden...
                </>
              ) : (
                <>
                  Overslaan
                  <ArrowRightIcon className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
