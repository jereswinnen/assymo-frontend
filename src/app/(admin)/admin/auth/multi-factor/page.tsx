"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  ShieldCheckIcon,
  FingerprintIcon,
  RectangleEllipsisIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { t } from "@/config/strings";

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
    setLoading(false);
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
      <>
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-6 opacity-80" />
          <p className="text-2xl font-semibold tracking-tight">
            {t("admin.headings.twoStepVerification")}
          </p>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {t("admin.dialogs.twoStepDesc")}
        </p>
      </header>

      <div className="p-4 space-y-4 border border-border rounded-lg">
        <Button
          variant="ghost"
          className="w-full justify-start h-auto"
          onClick={handleSetupOTP}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RectangleEllipsisIcon className="size-5 opacity-80" />
              <p className="text-base font-medium">{t("admin.dialogs.authenticatorApp")}</p>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {t("admin.dialogs.authenticatorAppDesc")}
            </p>
          </div>
        </Button>

        <Separator />

        <Button
          variant="ghost"
          className="w-full justify-start h-auto"
          onClick={handleSetupPasskey}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FingerprintIcon className="size-5 opacity-80" />
              <p className="text-base font-medium">{t("admin.dialogs.passkeyMethod")}</p>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {t("admin.dialogs.passkeyMethodDesc")}
            </p>
          </div>
        </Button>
      </div>

      <Button variant="secondary" onClick={handleSkip} disabled={skipping}>
        {skipping ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {t("admin.loading.default")}
          </>
        ) : (
          <>{t("admin.buttons.skip")}</>
        )}
      </Button>
    </div>
  );
}
