"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

// No baseURL needed - Better Auth automatically uses the current origin
// This works for localhost, preview deployments, and production
export const authClient = createAuthClient({
  plugins: [twoFactorClient(), passkeyClient()],
});
