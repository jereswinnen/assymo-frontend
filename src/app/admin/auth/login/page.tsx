"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LogInIcon,
  Loader2Icon,
  ArrowLeftIcon,
  MailIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Vul alle velden in.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        // Provide user-friendly error messages
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
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Er is iets misgegaan. Probeer het opnieuw.");
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
        setResetEmailSent(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (resetEmailSent) {
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

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setForgotPassword(false);
                setResetEmailSent(false);
                setError(null);
              }}
            >
              <ArrowLeftIcon className="size-4" />
              Terug naar inloggen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (forgotPassword) {
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
                placeholder="admin@assymo.nl"
                disabled={loading}
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !email}>
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
              onClick={() => {
                setForgotPassword(false);
                setError(null);
              }}
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="p-0 pb-6">
          <p className="text-2xl font-medium">Assymo Admin</p>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="admin@assymo.nl"
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
                  setForgotPassword(true);
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
