interface SiteContext {
  siteId: string | null;
}

const context: SiteContext = {
  siteId: null,
};

export function setSiteContext(siteId: string): void {
  context.siteId = siteId;
}

export function getSiteContext(): string | null {
  return context.siteId;
}

export function clearSiteContext(): void {
  context.siteId = null;
}

export function requireSiteContext(): string {
  if (!context.siteId) {
    throw new Error(
      "Site context not set. Use the set_site tool to select a site first."
    );
  }
  return context.siteId;
}
