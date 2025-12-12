import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    // Disable sign-up - admins create users manually via CLI
    disableSignUp: true,
  },
  session: {
    // 24 hour sessions
    expiresIn: 60 * 60 * 24,
    // Refresh when 1 hour remaining
    updateAge: 60 * 60 * 23,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});

// Type exports for client
export type Session = typeof auth.$Infer.Session;
