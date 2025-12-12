"use client";

import { createAuthClient } from "better-auth/react";

// No baseURL needed - Better Auth automatically uses the current origin
// This works for localhost, preview deployments, and production
export const authClient = createAuthClient();
