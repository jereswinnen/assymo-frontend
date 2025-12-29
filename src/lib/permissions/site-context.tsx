"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface Site {
  id: string;
  name: string;
  slug: string;
}

interface SiteContextType {
  // Currently selected site for content filtering
  currentSite: Site | null;
  // All sites the user has access to
  availableSites: Site[];
  // Loading state
  loading: boolean;
  // Select a different site
  selectSite: (siteId: string) => void;
  // Refresh sites from server
  refreshSites: () => Promise<void>;
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

  const fetchUserSites = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/user-sites");
      if (!response.ok) {
        console.error("Failed to fetch user sites");
        return;
      }
      const data = await response.json();
      const sites: Site[] = data.sites || [];
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
    } catch (error) {
      console.error("Error fetching user sites:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserSites();
  }, [fetchUserSites]);

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
    await fetchUserSites();
  }, [fetchUserSites]);

  return (
    <SiteContext.Provider
      value={{
        currentSite,
        availableSites,
        loading,
        selectSite,
        refreshSites,
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
