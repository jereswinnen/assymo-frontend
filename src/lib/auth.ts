import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { PasswordReset } from "@/emails/PasswordReset";

function getBaseURL() {
  // Explicit override takes precedence
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  // Vercel deployments - always use VERCEL_URL for cookies to work correctly
  // VERCEL_URL is the actual URL being accessed (e.g., assymo-frontend.vercel.app)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local development
  return "http://localhost:3000";
}

function getTrustedOrigins(): string[] {
  const origins: string[] = ["http://localhost:3000"];

  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.BETTER_AUTH_URL) {
    origins.push(process.env.BETTER_AUTH_URL);
  }

  return origins;
}

export const auth = betterAuth({
  appName: "Assymo Admin",
  baseURL: getBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  user: {
    additionalFields: {
      mfaChoiceCompleted: {
        type: "boolean",
        defaultValue: false,
      },
      role: {
        type: "string",
        defaultValue: "content_editor",
        input: false, // Cannot be set during signup (admin only)
      },
      featureOverrides: {
        type: "string", // JSONB stored as string, parsed in app
        required: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    // Disable sign-up - admins create users manually via CLI
    disableSignUp: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: RESEND_CONFIG.fromAddressAuth,
        to: user.email,
        subject: RESEND_CONFIG.subjects.passwordReset,
        react: PasswordReset({ resetUrl: url }),
      });
    },
  },
  plugins: [
    twoFactor({
      issuer: "Assymo Admin",
    }),
    passkey(),
  ],
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
