"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompassIcon, Loader2Icon } from "lucide-react";
import { useSiteContext } from "@/lib/permissions/site-context";

interface SiteSelectorProps {
  className?: string;
}

export function SiteSelector({ className }: SiteSelectorProps) {
  const { currentSite, availableSites, loading, selectSite } = useSiteContext();

  // Don't show selector if only one site available
  if (!loading && availableSites.length <= 1) {
    return null;
  }

  if (loading) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
      >
        <Loader2Icon className="size-4 animate-spin" />
        <span>Laden...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select value={currentSite?.id || ""} onValueChange={selectSite}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <CompassIcon className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Selecteer site" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableSites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
