"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSiteContext } from "./site-context";
import type { Feature } from "./types";

/**
 * Hook to require a specific feature for accessing a page.
 * Redirects to /admin if the user doesn't have access.
 *
 * Usage:
 * ```tsx
 * export default function AppointmentsPage() {
 *   const { authorized, loading } = useRequireFeature("appointments");
 *
 *   if (loading || !authorized) {
 *     return null; // or a loading skeleton
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRequireFeature(feature: Feature) {
  const router = useRouter();
  const { visibleFeatures, loading } = useSiteContext();

  const authorized = !loading && visibleFeatures.includes(feature);

  useEffect(() => {
    if (!loading && !visibleFeatures.includes(feature)) {
      router.replace("/admin");
    }
  }, [loading, visibleFeatures, feature, router]);

  return { authorized, loading };
}
