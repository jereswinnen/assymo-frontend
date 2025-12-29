"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  FieldGroup,
} from "@/components/ui/field";
import { Loader2Icon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PasswordSection } from "@/components/admin/account/PasswordSection";
import { TwoFactorSection } from "@/components/admin/account/TwoFactorSection";
import { PasskeysSection } from "@/components/admin/account/PasskeysSection";
import { SessionsSection } from "@/components/admin/account/SessionsSection";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setTwoFactorEnabled(session.user.twoFactorEnabled ?? false);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FieldGroup className="max-w-2xl">
      <PasswordSection />

      <Separator />

      <TwoFactorSection
        enabled={twoFactorEnabled}
        onToggle={setTwoFactorEnabled}
      />

      <Separator />

      <PasskeysSection />

      <Separator />

      <SessionsSection />
    </FieldGroup>
  );
}
