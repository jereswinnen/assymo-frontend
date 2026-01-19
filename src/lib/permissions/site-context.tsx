"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Feature, Role, FeatureOverrides } from "./types";

interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  capabilities: Feature[];
}

interface UserPermissions {
  role: Role;
  effectiveFeatures: Feature[];
}

interface SiteContextType {
  // Site state
  currentSite: Site | null;
  availableSites: Site[];
  loading: boolean;
  selectSite: (siteId: string) => void;
  refreshSites: () => Promise<void>;

  // Current site capabilities
  currentSiteCapabilities: Feature[];

  // User permissions intersected with site capabilities
  // This is what should be used to determine what nav items to show
  visibleFeatures: Feature[];

  // User info
  userRole: Role | null;
  effectiveFeatures: Feature[]; // User's effective features (before site intersection)
}

const SiteContext = createContext<SiteContextType | null>(null);

const SITE_STORAGE_KEY = "assymo_selected_site_id";

interface SiteProviderProps {
  children: ReactNode;
}

export function SiteProvider({ children }: SiteProviderProps) {
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  // Fetch both sites and permissions in a single effect
  const fetchData = useCallback(async () => {
    try {
      // Fetch sites and permissions in parallel
      const [sitesResponse, permissionsResponse] = await Promise.all([
        fetch("/api/admin/user-sites"),
        fetch("/api/admin/user-permissions"),
      ]);

      // Handle sites
      if (sitesResponse.ok) {
        const sitesData = await sitesResponse.json();
        const sites: Site[] = (sitesData.sites || []).map((s: {
          id: string;
          name: string;
          slug: string;
          domain: string | null;
          capabilities?: Feature[];
        }) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          domain: s.domain,
          capabilities: s.capabilities || [],
        }));
        setAvailableSites(sites);

        // Restore selected site from localStorage or default to first site
        const storedSiteId = localStorage.getItem(SITE_STORAGE_KEY);
        const storedSite = sites.find((s) => s.id === storedSiteId);

        if (storedSite) {
          setCurrentSite(storedSite);
        } else if (sites.length > 0) {
          setCurrentSite(sites[0]);
          localStorage.setItem(SITE_STORAGE_KEY, sites[0].id);
        }
      } else {
        console.error("Failed to fetch user sites");
      }

      // Handle permissions
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setUserPermissions({
          role: permissionsData.role,
          effectiveFeatures: permissionsData.effectiveFeatures || [],
        });
      } else {
        console.error("Failed to fetch user permissions");
      }
    } catch (error) {
      console.error("Error fetching site context data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectSite = useCallback(
    (siteId: string) => {
      const site = availableSites.find((s) => s.id === siteId);
      if (site) {
        setCurrentSite(site);
        localStorage.setItem(SITE_STORAGE_KEY, siteId);
      }
    },
    [availableSites]
  );

  const refreshSites = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // Get current site capabilities
  const currentSiteCapabilities = useMemo(() => {
    return currentSite?.capabilities || [];
  }, [currentSite]);

  // User's effective features (before site intersection)
  const effectiveFeatures = useMemo(() => {
    return userPermissions?.effectiveFeatures || [];
  }, [userPermissions]);

  // Compute visible features: user permissions intersected with site capabilities
  // Super admin sees everything the site supports
  // Other users see only features they have access to AND the site supports
  const visibleFeatures = useMemo(() => {
    if (!userPermissions || !currentSite) {
      return [];
    }

    const { role, effectiveFeatures } = userPermissions;
    const siteCapabilities = currentSite.capabilities || [];

    // Super admin sees all site capabilities plus admin features (users, sites)
    if (role === "super_admin") {
      // For super_admin, show site capabilities plus users/sites features
      return [...siteCapabilities, "users", "sites"] as Feature[];
    }

    // For other roles, intersect their effective features with site capabilities
    // But global features (users, sites, settings) should not be intersected with site capabilities
    // since they're not site-specific
    const globalAdminFeatures: Feature[] = ["users", "sites"];
    const globalBusinessFeatures: Feature[] = ["settings"];

    const siteFeatures = effectiveFeatures.filter((f) => siteCapabilities.includes(f));
    const globalFeatures = effectiveFeatures.filter(
      (f) => globalAdminFeatures.includes(f) || globalBusinessFeatures.includes(f)
    );

    // For business features that ARE in site capabilities, they should be intersected
    const businessCapabilityFeatures: Feature[] = ["appointments", "emails", "conversations"];
    const intersectedBusinessFeatures = effectiveFeatures.filter(
      (f) => businessCapabilityFeatures.includes(f) && siteCapabilities.includes(f)
    );

    return [...new Set([...siteFeatures, ...globalFeatures, ...intersectedBusinessFeatures])];
  }, [userPermissions, currentSite]);

  return (
    <SiteContext.Provider
      value={{
        currentSite,
        availableSites,
        loading,
        selectSite,
        refreshSites,
        currentSiteCapabilities,
        visibleFeatures,
        userRole: userPermissions?.role || null,
        effectiveFeatures,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSiteContext must be used within a SiteProvider");
  }
  return context;
}

/**
 * Hook to get only the current site ID (simpler for most use cases)
 */
export function useCurrentSiteId(): string | null {
  const { currentSite } = useSiteContext();
  return currentSite?.id ?? null;
}
