"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  LogInIcon,
  Loader2Icon,
  ArrowLeftIcon,
  MailIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthStep = "login" | "2fa" | "forgot-password" | "reset-email-sent";

export default function AdminLoginPage() {
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
              router.push("/admin");
              router.refresh();
            }
          }
        }
      } catch (err) {
        // Silently ignore - autofill is optional
        console.debug("Passkey autofill not available:", err);
      }
    };

    startPasskeyAutofill();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Vul alle velden in.");
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
          setError("Ongeldige e-mail of wachtwoord.");
        } else if (error.message?.toLowerCase().includes("not found")) {
          setError("Geen account gevonden met dit e-mailadres.");
        } else {
          setError(error.message || "Ongeldige inloggegevens.");
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
          router.push("/admin/auth/multi-factor");
          return;
        }
      }

      // Login complete
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError("Vul een 6-cijferige code in.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: otpCode,
      });

      if (error) {
        console.error("2FA verification error:", error);
        setError("Ongeldige code. Probeer opnieuw.");
        setOtpCode("");
        return;
      }

      // 2FA verified, go to admin
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("2FA verification error:", err);
      setError("Er is iets misgegaan. Probeer het opnieuw.");
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Vul je e-mailadres in.");
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
      setError("Er is iets misgegaan. Probeer het opnieuw.");
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="size-6 text-green-600" />
              <p className="text-2xl font-medium">E-mail verstuurd</p>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Als er een account bestaat met het e-mailadres{" "}
              <strong>{email}</strong>, ontvang je binnen enkele minuten een
              link om je wachtwoord te resetten.
            </p>

            <Button variant="outline" className="w-full" onClick={resetToLogin}>
              <ArrowLeftIcon className="size-4" />
              Terug naar inloggen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (step === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <p className="text-2xl font-medium">Wachtwoord vergeten?</p>
            <p className="text-muted-foreground text-sm mt-1">
              Vul je e-mailadres in om een reset link te ontvangen.
            </p>
          </CardHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="admin@assymo.be"
                disabled={loading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Versturen...
                </>
              ) : (
                <>
                  <MailIcon className="size-4" />
                  Verstuur reset link
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={resetToLogin}
              disabled={loading}
            >
              <ArrowLeftIcon className="size-4" />
              Terug naar inloggen
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // 2FA verification
  if (step === "2fa") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-6" />
              <p className="text-2xl font-medium">Verificatie</p>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Vul de 6-cijferige code uit je authenticator app in.
            </p>
          </CardHeader>

          <form onSubmit={handleVerify2FA} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Verifiëren...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="size-4" />
                  Verifiëren
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={resetToLogin}
              disabled={loading}
            >
              <ArrowLeftIcon className="size-4" />
              Terug naar inloggen
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="p-0 pb-6">
          <p className="text-2xl font-medium">Assymo Admin</p>
        </CardHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="admin@assymo.be"
              autoComplete="username webauthn"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Wachtwoord</Label>
              <button
                type="button"
                tabIndex={-1}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setStep("forgot-password");
                  setError(null);
                }}
              >
                Wachtwoord vergeten?
              </button>
            </div>
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
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Laden...
              </>
            ) : (
              <>
                <LogInIcon className="size-4" />
                Inloggen
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
