"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAdminNavigationGuard } from "@/components/admin/AdminHeaderContext";
import { useSiteContext } from "@/lib/permissions/site-context";

interface PageItem {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
}

interface SolutionItem {
  id: string;
  name: string;
  slug: string;
}

interface ConfiguratorCategoryItem {
  id: string;
  name: string;
  slug: string;
}

type ContentType = "pages" | "solutions" | "configurator";

interface BreadcrumbDropdownProps {
  type: ContentType;
  currentTitle: string;
}

export function BreadcrumbDropdown({
  type,
  currentTitle,
}: BreadcrumbDropdownProps) {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;
  const currentCategoryId = params.categoryId as string;
  const { currentSite } = useSiteContext();
  const { hasUnsavedChanges, saveBeforeNavigate } = useAdminNavigationGuard();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<(PageItem | SolutionItem)[]>([]);
  const [configuratorCategories, setConfiguratorCategories] = useState<ConfiguratorCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [navigating, setNavigating] = useState(false);

  // Fetch items when popover opens
  useEffect(() => {
    if (!open) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        if (type === "configurator") {
          // Fetch configurator categories
          if (currentSite?.id) {
            const response = await fetch(`/api/admin/configurator/categories?siteId=${currentSite.id}`);
            if (response.ok) {
              const data = await response.json();
              setConfiguratorCategories(data);
            }
          }
        } else {
          const endpoint =
            type === "pages"
              ? "/api/admin/content/pages"
              : "/api/admin/content/solutions";
          const url = currentSite?.id
            ? `${endpoint}?siteId=${currentSite.id}`
            : endpoint;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setItems(data);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [open, type, currentSite?.id]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (type === "configurator") {
      if (!search.trim()) return configuratorCategories;
      const query = search.toLowerCase();
      return configuratorCategories.filter((c) =>
        c.name.toLowerCase().includes(query)
      );
    }

    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter((item) => {
      const name = "title" in item ? item.title : item.name;
      return name.toLowerCase().includes(query);
    });
  }, [items, search, type, configuratorCategories]);

  const handleSelect = async (
    item: PageItem | SolutionItem | ConfiguratorCategoryItem
  ) => {
    // Check if already on this item
    if (type === "configurator") {
      const category = item as ConfiguratorCategoryItem;
      if (category.id === currentCategoryId) {
        setOpen(false);
        return;
      }
    } else {
      const contentItem = item as PageItem | SolutionItem;
      if (contentItem.id === currentId) {
        setOpen(false);
        return;
      }
    }

    setNavigating(true);

    // Auto-save if there are unsaved changes
    if (hasUnsavedChanges && saveBeforeNavigate) {
      const saved = await saveBeforeNavigate();
      if (!saved) {
        setNavigating(false);
        return;
      }
    }

    let path: string;
    if (type === "configurator") {
      const category = item as ConfiguratorCategoryItem;
      path = `/admin/content/configurator/${category.id}`;
    } else if (type === "pages") {
      const pageItem = item as PageItem;
      path = `/admin/content/pages/${pageItem.id}`;
    } else {
      const solutionItem = item as SolutionItem;
      path = `/admin/content/solutions/${solutionItem.id}`;
    }

    router.push(path);
    setOpen(false);
    setNavigating(false);
  };

  const getItemName = (
    item: PageItem | SolutionItem | ConfiguratorCategoryItem
  ): string => {
    if (type === "configurator") {
      return (item as ConfiguratorCategoryItem).name;
    }
    if ("title" in item) {
      return item.title;
    }
    return (item as SolutionItem).name;
  };

  const getItemKey = (
    item: PageItem | SolutionItem | ConfiguratorCategoryItem
  ): string => {
    if (type === "configurator") {
      return (item as ConfiguratorCategoryItem).id;
    }
    return (item as PageItem | SolutionItem).id;
  };

  const isItemActive = (
    item: PageItem | SolutionItem | ConfiguratorCategoryItem
  ): boolean => {
    if (type === "configurator") {
      return (item as ConfiguratorCategoryItem).id === currentCategoryId;
    }
    return (item as PageItem | SolutionItem).id === currentId;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={navigating}
        >
          {navigating ? (
            <Loader2Icon className="size-3 animate-spin" />
          ) : null}
          {currentTitle}
          <ChevronDownIcon className="size-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Zoeken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {search ? "Geen resultaten" : "Geen items"}
            </div>
          ) : (
            <div className="p-1">
              {filteredItems.map((item) => {
                const name = getItemName(item);
                const key = getItemKey(item);
                const isActive = isItemActive(item);
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(item)}
                    disabled={navigating}
                    className={cn(
                      "w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:bg-accent",
                      "disabled:opacity-50 disabled:pointer-events-none",
                      isActive && "bg-accent"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
