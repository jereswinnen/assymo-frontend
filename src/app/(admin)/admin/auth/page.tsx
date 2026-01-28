"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  LogInIcon,
  Loader2Icon,
  MailIcon,
  AlertCircleIcon,
  LockKeyholeIcon,
  RotateCcwKeyIcon,
  MailboxIcon,
  ShieldEllipsisIcon,
  CheckIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { t } from "@/config/strings";

type AuthStep = "login" | "2fa" | "forgot-password" | "reset-email-sent";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginPage() {
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start passkey autofill listener when page loads
  useEffect(() => {
    const startPasskeyAutofill = async () => {
      try {
        // Check if WebAuthn conditional mediation is supported
        if (
          typeof window !== "undefined" &&
          window.PublicKeyCredential &&
          typeof PublicKeyCredential.isConditionalMediationAvailable ===
            "function"
        ) {
          const available =
            await PublicKeyCredential.isConditionalMediationAvailable();
          if (available) {
            // Start listening for passkey autofill
            const { error } = await authClient.signIn.passkey({
              autoFill: true,
            });
            if (!error) {
              window.location.href = "/admin";
            }
          }
        }
      } catch (err) {
        // Silently ignore - autofill is optional
        console.debug("Passkey autofill not available:", err);
      }
    };

    startPasskeyAutofill();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t("admin.messages.fillAllFieldsAuth"));
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        if (
          error.message?.toLowerCase().includes("invalid") ||
          error.message?.toLowerCase().includes("incorrect")
        ) {
          setError(t("admin.messages.invalidCredentials"));
        } else if (error.message?.toLowerCase().includes("not found")) {
          setError(t("admin.messages.accountNotFound"));
        } else {
          setError(error.message || t("admin.messages.invalidLogin"));
        }
        return;
      }

      // Check if 2FA is required
      if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
        setStep("2fa");
        return;
      }

      // Check if user needs to complete MFA choice
      const session = await authClient.getSession();
      if (session.data?.user) {
        const user = session.data.user as { mfaChoiceCompleted?: boolean };
        if (!user.mfaChoiceCompleted) {
          // Redirect to MFA choice page
          window.location.href = "/admin/auth/multi-factor";
          return;
        }
      }

      // Login complete - use hard navigation to ensure cookies are sent
      window.location.href = "/admin";
    } catch (err) {
      console.error("Login error:", err);
      setError(t("admin.messages.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError(t("admin.messages.enter6DigitCode"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: otpCode,
      });

      if (error) {
        console.error("2FA verification error:", error);
        setError(t("admin.messages.invalidCode"));
        setOtpCode("");
        return;
      }

      // 2FA verified - use hard navigation to ensure cookies are sent
      window.location.href = "/admin";
    } catch (err) {
      console.error("2FA verification error:", err);
      setError(t("admin.messages.somethingWentWrong"));
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t("admin.messages.enterEmail"));
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError(t("admin.messages.emailInvalid"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/admin/auth/reset-password",
      });

      if (error) {
        console.error("Forgot password error:", error);
        setError(error.message || "Er is iets misgegaan.");
      } else {
        setStep("reset-email-sent");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(t("admin.messages.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setStep("login");
    setError(null);
    setOtpCode("");
  };

  // Reset email sent confirmation
  if (step === "reset-email-sent") {
    return (
      <div className="w-full max-w-lg space-y-6">
        <header className="flex items-center gap-2">
          <MailboxIcon className="size-6 opacity-80" />
          <p className="text-2xl font-medium">{t("admin.headings.emailSent")}</p>
        </header>

        <div className="space-y-6">
          <p className="text-muted-foreground">
            Als er een account bestaat met het e-mailadres{" "}
            <strong>{email}</strong>, ontvang je binnen enkele minuten een link
            om je wachtwoord te resetten.
          </p>

          <Button variant="secondary" onClick={resetToLogin}>
            {t("admin.buttons.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  // Forgot password form
  if (step === "forgot-password") {
    return (
      <div className="w-full max-w-lg space-y-6">
        <header className="flex items-center gap-2">
          <RotateCcwKeyIcon className="size-6 opacity-80" />
          <p className="text-2xl font-semibold tracking-tight">
            {t("admin.headings.resetPassword")}
          </p>
        </header>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="email">{t("admin.labels.email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder={t("admin.placeholders.emailExample")}
              disabled={loading}
              autoFocus
            />
            <FieldDescription>
              {t("admin.dialogs.resetEmailHint")}
            </FieldDescription>
          </Field>

          <Field orientation="horizontal" className="justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={resetToLogin}
              disabled={loading}
            >
              {t("admin.buttons.backToLogin")}
            </Button>

            <Button
              type="submit"
              disabled={loading || !EMAIL_REGEX.test(email)}
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.sending")}
                </>
              ) : (
                <>
                  <MailIcon className="size-4" />
                  {t("admin.buttons.sendLink")}
                </>
              )}
            </Button>
          </Field>
        </form>
      </div>
    );
  }

  // 2FA verification
  if (step === "2fa") {
    return (
      <div className="w-full max-w-lg space-y-6">
        <header className="flex items-center gap-2">
          <ShieldEllipsisIcon className="size-6 opacity-80" />
          <p className="text-2xl font-semibold tracking-tight">{t("admin.headings.verification")}</p>
        </header>

        <form onSubmit={handleVerify2FA} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={(value) => {
              setOtpCode(value);
              setError(null);
            }}
            disabled={loading}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <p className="text-muted-foreground text-sm">
            {t("admin.dialogs.enter2faCode")}
          </p>
        </form>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={resetToLogin}
            disabled={loading}
          >
            {t("admin.buttons.backToLogin")}
          </Button>

          <Button type="submit" disabled={loading || otpCode.length !== 6}>
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("admin.loading.verifying")}
              </>
            ) : (
              <>
                <CheckIcon className="size-4" />
                {t("admin.buttons.verify")}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="w-full max-w-lg space-y-6">
      <header className="flex items-center gap-2">
        <LockKeyholeIcon className="size-6 opacity-80" />
        <p className="text-2xl font-semibold tracking-tight">{t("admin.headings.login")}</p>
      </header>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{t("admin.labels.email")}</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={t("admin.placeholders.emailExample")}
                autoComplete="username webauthn"
                disabled={loading}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">{t("admin.labels.password")}</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                disabled={loading}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field orientation="horizontal" className="justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("forgot-password");
              setError(null);
            }}
          >
            {t("admin.buttons.forgotPassword")}
          </Button>

          <Button type="submit" disabled={loading || !email || !password}>
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("admin.loading.default")}
              </>
            ) : (
              <>
                <LogInIcon className="size-4" />
                {t("admin.buttons.login")}
              </>
            )}
          </Button>
        </Field>
      </form>
    </div>
  );
}
