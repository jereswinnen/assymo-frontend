"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Loader2Icon,
  AlertCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CopyIcon,
  KeyIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

type SetupStep = "password" | "qr" | "backup-codes";

export default function Setup2FAPage() {
  const [step, setStep] = useState<SetupStep>("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        // Check if user is authenticated
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/admin/auth");
          return;
        }

        // Check if 2FA is already enabled
        if (session.data.user.twoFactorEnabled) {
          router.push("/admin");
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
        router.push("/admin/auth");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Vul je wachtwoord in.");
      return;
    }

    setEnabling(true);

    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });

      if (error) {
        console.error("2FA enable error:", error);
        if (
          error.message?.toLowerCase().includes("invalid") ||
          error.message?.toLowerCase().includes("incorrect")
        ) {
          setError("Ongeldig wachtwoord.");
        } else {
          setError(error.message || "Kon 2FA niet inschakelen.");
        }
        return;
      }

      if (data) {
        setTotpUri(data.totpURI);
        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
        }
        setStep("qr");
      }
    } catch (err) {
      console.error("2FA enable error:", err);
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setEnabling(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError("Vul een 6-cijferige code in.");
      return;
    }

    setVerifying(true);

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: otpCode,
      });

      if (error) {
        console.error("2FA verification error:", error);
        setError("Ongeldige code. Probeer opnieuw.");
        setOtpCode("");
        return;
      }

      // If we got backup codes from enable, show them
      const responseData = data as { backupCodes?: string[] } | undefined;
      if (backupCodes.length > 0) {
        setStep("backup-codes");
      } else if (responseData?.backupCodes) {
        setBackupCodes(responseData.backupCodes);
        setStep("backup-codes");
      } else {
        // No backup codes, check if should go to passkey setup
        const skippedPasskey = localStorage.getItem("passkey_skipped") === "true";
        if (skippedPasskey) {
          router.push("/admin");
          router.refresh();
        } else {
          router.push("/admin/auth/setup-passkey");
        }
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      setError("Er is iets misgegaan. Probeer opnieuw.");
      setOtpCode("");
    } finally {
      setVerifying(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    const skippedPasskey = localStorage.getItem("passkey_skipped") === "true";
    if (skippedPasskey) {
      router.push("/admin");
      router.refresh();
    } else {
      router.push("/admin/auth/setup-passkey");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !totpUri) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <p className="text-2xl font-medium">Fout</p>
          </CardHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <Button
              className="w-full"
              onClick={() => router.push("/admin/auth")}
            >
              Terug naar inloggen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Backup codes step
  if (step === "backup-codes") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <p className="text-2xl font-medium">Backup codes</p>
            <p className="text-muted-foreground text-sm mt-1">
              Bewaar deze codes op een veilige plek. Je kunt ze gebruiken als je
              geen toegang hebt tot je authenticator app.
            </p>
          </CardHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={copyBackupCodes}>
              {copied ? (
                <>
                  <CheckCircleIcon className="size-4" />
                  Gekopieerd
                </>
              ) : (
                <>
                  <CopyIcon className="size-4" />
                  Kopieer codes
                </>
              )}
            </Button>

            <Button className="w-full" onClick={handleComplete}>
              Ik heb de codes opgeslagen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Password step - confirm identity before enabling 2FA
  if (step === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="p-0 pb-6">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-6" />
              <p className="text-2xl font-medium">2FA instellen</p>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Bevestig je wachtwoord om tweestapsverificatie in te schakelen.
            </p>
          </CardHeader>

          <form onSubmit={handleEnableTwoFactor} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                disabled={enabling}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={enabling || !password}
            >
              {enabling ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Laden...
                </>
              ) : (
                <>
                  <KeyIcon className="size-4" />
                  Doorgaan
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // QR code step
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="p-0 pb-6">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-6" />
            <p className="text-2xl font-medium">2FA instellen</p>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Scan de QR code met je authenticator app (bijv. Google Authenticator,
            Authy, 1Password).
          </p>
        </CardHeader>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {totpUri && (
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <QRCode value={totpUri} size={200} />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Voer de 6-cijferige code in om te bevestigen
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => {
                  setOtpCode(value);
                  setError(null);
                }}
                disabled={verifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={verifying || otpCode.length !== 6}
          >
            {verifying ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Verifiëren...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="size-4" />
                Bevestigen
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
