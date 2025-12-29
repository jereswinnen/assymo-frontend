import { describe, it, expect } from "vitest";
import {
  hasFeatureAccess,
  canAccessSite,
  getAccessibleSites,
  isSiteScopedFeature,
  hasAccess,
  hasRole,
  isSuperAdmin,
  isAdmin,
} from "./check";
import type { PermissionContext } from "./types";

// Helper to create permission contexts
function createContext(
  role: "super_admin" | "admin" | "content_editor",
  userSites: string[] = [],
  featureOverrides: { grants?: string[]; revokes?: string[] } | null = null
): PermissionContext {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      role,
      featureOverrides: featureOverrides as PermissionContext["user"]["featureOverrides"],
    },
    userSites,
  };
}

describe("hasFeatureAccess", () => {
  describe("super_admin", () => {
    it("has access to all features", () => {
      const ctx = createContext("super_admin");
      expect(hasFeatureAccess(ctx, "pages")).toBe(true);
      expect(hasFeatureAccess(ctx, "appointments")).toBe(true);
      expect(hasFeatureAccess(ctx, "users")).toBe(true);
      expect(hasFeatureAccess(ctx, "sites")).toBe(true);
    });
  });

  describe("admin", () => {
    it("has access to content features", () => {
      const ctx = createContext("admin");
      expect(hasFeatureAccess(ctx, "pages")).toBe(true);
      expect(hasFeatureAccess(ctx, "solutions")).toBe(true);
      expect(hasFeatureAccess(ctx, "media")).toBe(true);
    });

    it("has access to business features", () => {
      const ctx = createContext("admin");
      expect(hasFeatureAccess(ctx, "appointments")).toBe(true);
      expect(hasFeatureAccess(ctx, "emails")).toBe(true);
      expect(hasFeatureAccess(ctx, "conversations")).toBe(true);
    });

    it("does not have access to admin features", () => {
      const ctx = createContext("admin");
      expect(hasFeatureAccess(ctx, "users")).toBe(false);
      expect(hasFeatureAccess(ctx, "sites")).toBe(false);
    });
  });

  describe("content_editor", () => {
    it("has access to content features", () => {
      const ctx = createContext("content_editor");
      expect(hasFeatureAccess(ctx, "pages")).toBe(true);
      expect(hasFeatureAccess(ctx, "solutions")).toBe(true);
      expect(hasFeatureAccess(ctx, "media")).toBe(true);
    });

    it("does not have access to business features", () => {
      const ctx = createContext("content_editor");
      expect(hasFeatureAccess(ctx, "appointments")).toBe(false);
      expect(hasFeatureAccess(ctx, "emails")).toBe(false);
      expect(hasFeatureAccess(ctx, "conversations")).toBe(false);
    });

    it("does not have access to admin features", () => {
      const ctx = createContext("content_editor");
      expect(hasFeatureAccess(ctx, "users")).toBe(false);
      expect(hasFeatureAccess(ctx, "sites")).toBe(false);
    });
  });

  describe("feature overrides", () => {
    it("grants access to features beyond role defaults", () => {
      const ctx = createContext("content_editor", [], {
        grants: ["appointments"],
      });
      expect(hasFeatureAccess(ctx, "appointments")).toBe(true);
    });

    it("revokes access to features from role defaults", () => {
      const ctx = createContext("admin", [], {
        revokes: ["appointments"],
      });
      expect(hasFeatureAccess(ctx, "appointments")).toBe(false);
    });

    it("revoke takes precedence over role default", () => {
      const ctx = createContext("admin", [], {
        revokes: ["pages"],
      });
      expect(hasFeatureAccess(ctx, "pages")).toBe(false);
    });

    it("grant does not affect super_admin (already has access)", () => {
      const ctx = createContext("super_admin", [], {
        grants: ["pages"],
      });
      expect(hasFeatureAccess(ctx, "pages")).toBe(true);
    });
  });
});

describe("canAccessSite", () => {
  it("super_admin can access any site", () => {
    const ctx = createContext("super_admin", []);
    expect(canAccessSite(ctx, "site-1")).toBe(true);
    expect(canAccessSite(ctx, "site-2")).toBe(true);
  });

  it("admin can only access assigned sites", () => {
    const ctx = createContext("admin", ["site-1"]);
    expect(canAccessSite(ctx, "site-1")).toBe(true);
    expect(canAccessSite(ctx, "site-2")).toBe(false);
  });

  it("content_editor can only access assigned sites", () => {
    const ctx = createContext("content_editor", ["site-1", "site-2"]);
    expect(canAccessSite(ctx, "site-1")).toBe(true);
    expect(canAccessSite(ctx, "site-2")).toBe(true);
    expect(canAccessSite(ctx, "site-3")).toBe(false);
  });
});

describe("getAccessibleSites", () => {
  it("returns 'all' for super_admin", () => {
    const ctx = createContext("super_admin", ["site-1"]);
    expect(getAccessibleSites(ctx)).toBe("all");
  });

  it("returns site list for admin", () => {
    const ctx = createContext("admin", ["site-1", "site-2"]);
    expect(getAccessibleSites(ctx)).toEqual(["site-1", "site-2"]);
  });

  it("returns site list for content_editor", () => {
    const ctx = createContext("content_editor", ["site-1"]);
    expect(getAccessibleSites(ctx)).toEqual(["site-1"]);
  });
});

describe("isSiteScopedFeature", () => {
  it("returns true for content features", () => {
    expect(isSiteScopedFeature("pages")).toBe(true);
    expect(isSiteScopedFeature("solutions")).toBe(true);
    expect(isSiteScopedFeature("media")).toBe(true);
  });

  it("returns false for global features", () => {
    expect(isSiteScopedFeature("appointments")).toBe(false);
    expect(isSiteScopedFeature("emails")).toBe(false);
    expect(isSiteScopedFeature("users")).toBe(false);
  });
});

describe("hasAccess", () => {
  it("checks both feature and site access for site-scoped features", () => {
    const ctx = createContext("content_editor", ["site-1"]);
    expect(hasAccess(ctx, "pages", "site-1")).toBe(true);
    expect(hasAccess(ctx, "pages", "site-2")).toBe(false);
  });

  it("only checks feature access for global features", () => {
    const ctx = createContext("admin", ["site-1"]);
    expect(hasAccess(ctx, "appointments")).toBe(true);
    expect(hasAccess(ctx, "appointments", "site-2")).toBe(true); // site doesn't matter
  });

  it("denies access if feature access is denied", () => {
    const ctx = createContext("content_editor", ["site-1"]);
    expect(hasAccess(ctx, "appointments", "site-1")).toBe(false);
  });
});

describe("hasRole", () => {
  it("super_admin has all roles", () => {
    const ctx = createContext("super_admin");
    expect(hasRole(ctx, "super_admin")).toBe(true);
    expect(hasRole(ctx, "admin")).toBe(true);
    expect(hasRole(ctx, "content_editor")).toBe(true);
  });

  it("admin has admin and below", () => {
    const ctx = createContext("admin");
    expect(hasRole(ctx, "super_admin")).toBe(false);
    expect(hasRole(ctx, "admin")).toBe(true);
    expect(hasRole(ctx, "content_editor")).toBe(true);
  });

  it("content_editor only has content_editor", () => {
    const ctx = createContext("content_editor");
    expect(hasRole(ctx, "super_admin")).toBe(false);
    expect(hasRole(ctx, "admin")).toBe(false);
    expect(hasRole(ctx, "content_editor")).toBe(true);
  });
});

describe("isSuperAdmin", () => {
  it("returns true for super_admin", () => {
    expect(isSuperAdmin(createContext("super_admin"))).toBe(true);
  });

  it("returns false for admin", () => {
    expect(isSuperAdmin(createContext("admin"))).toBe(false);
  });

  it("returns false for content_editor", () => {
    expect(isSuperAdmin(createContext("content_editor"))).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for super_admin", () => {
    expect(isAdmin(createContext("super_admin"))).toBe(true);
  });

  it("returns true for admin", () => {
    expect(isAdmin(createContext("admin"))).toBe(true);
  });

  it("returns false for content_editor", () => {
    expect(isAdmin(createContext("content_editor"))).toBe(false);
  });
});
