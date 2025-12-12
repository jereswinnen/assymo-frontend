import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";
import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";
import { PasswordReset } from "@/emails/PasswordReset";

export const auth = betterAuth({
  appName: "Assymo Admin",
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
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
