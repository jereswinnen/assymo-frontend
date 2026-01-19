"use client";

import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { useAdminBreadcrumbTitle } from "@/components/admin/AdminHeaderContext";
import { t } from "@/config/strings";
import { Loader2Icon } from "lucide-react";

export default function ImageStudioPage() {
  const { authorized, loading } = useRequireFeature("media");

  // Set breadcrumb title
  useAdminBreadcrumbTitle(t("admin.nav.imageStudio"));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
        {/* Left: Image viewer placeholder */}
        <div className="md:col-span-2 min-h-0">
          <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Afbeelding viewer (Fase 2)</p>
          </div>
        </div>

        {/* Right: Chat sidebar placeholder */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground">Chat sidebar (Fase 4)</p>
        </div>
      </div>
    </div>
  );
}
