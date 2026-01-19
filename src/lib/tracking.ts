import { useOpenPanel } from "@openpanel/nextjs";

export function useTracking() {
  const op = useOpenPanel();

  return {
    track: (event: string, properties?: Record<string, unknown>) => {
      op.track(event, {
        ...properties,
        site: process.env.NEXT_PUBLIC_SITE_SLUG || "assymo",
      });
    },
  };
}
