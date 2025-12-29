"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ShieldCheckIcon,
  Loader2Icon,
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface TwoFactorSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

type SetupStep = "password" | "qr" | "backup-codes" | "disable";

export function TwoFactorSection({ enabled, onToggle }: TwoFactorSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const getSecretFromUri = (uri: string): string | null => {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret");
    } catch {
      return null;
    }
  };

  const secret = totpUri ? getSecretFromUri(totpUri) : null;

  const resetState = () => {
    setStep(enabled ? "disable" : "password");
    setPassword("");
    setTotpUri(null);
    setBackupCodes([]);
    setOtpCode("");
    setError(null);
    setCopied(false);
    setSecretCopied(false);
  };

  const openDialog = () => {
    resetState();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetState();
  };

  const handleEnableTwoFactor = async () => {
    if (!password) {
      setError("Vul je wachtwoord in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.twoFactor.enable({ password });

      if (error) {
        if (error.message?.toLowerCase().includes("invalid") ||
            error.message?.toLowerCase().includes("incorrect")) {
          setError("Ongeldig wachtwoord");
        } else {
          setError(error.message || "Kon 2FA niet inschakelen");
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
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setError("Vul een 6-cijferige code in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: otpCode,
      });

      if (error) {
        setError("Ongeldige code");
        setOtpCode("");
        return;
      }

      const responseData = data as { backupCodes?: string[] } | undefined;
      if (backupCodes.length > 0) {
        setStep("backup-codes");
      } else if (responseData?.backupCodes) {
        setBackupCodes(responseData.backupCodes);
        setStep("backup-codes");
      } else {
        onToggle(true);
        toast.success("Twee-factor authenticatie ingeschakeld");
        closeDialog();
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      setError("Er is een fout opgetreden");
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onToggle(true);
    toast.success("Twee-factor authenticatie ingeschakeld");
    closeDialog();
  };

  const handleDisable = async () => {
    if (!password) {
      setError("Vul je wachtwoord in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await authClient.twoFactor.disable({ password });

      if (error) {
        if (error.message?.toLowerCase().includes("invalid") ||
            error.message?.toLowerCase().includes("incorrect")) {
          setError("Ongeldig wachtwoord");
        } else {
          setError(error.message || "Kon 2FA niet uitschakelen");
        }
        return;
      }

      onToggle(false);
      toast.success("Twee-factor authenticatie uitgeschakeld");
      closeDialog();
    } catch (err) {
      console.error("2FA disable error:", err);
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  return (
    <>
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <ShieldCheckIcon className="size-4 opacity-80" />
          Twee-factor authenticatie
        </FieldLegend>
        <FieldDescription>
          Voeg een extra beveiligingslaag toe aan je account met een authenticator app.
        </FieldDescription>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">Authenticator app</p>
              <p className="text-sm text-muted-foreground">
                {enabled
                  ? "Je account is beveiligd met 2FA"
                  : "Niet ingeschakeld"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Actief
              </Badge>
            )}
            <Button
              variant={enabled ? "outline" : "default"}
              size="sm"
              onClick={openDialog}
            >
              {enabled ? "Uitschakelen" : "Inschakelen"}
            </Button>
          </div>
        </div>
      </FieldSet>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Disable 2FA */}
          {step === "disable" && (
            <>
              <DialogHeader>
                <DialogTitle>2FA uitschakelen</DialogTitle>
                <DialogDescription>
                  Bevestig je wachtwoord om twee-factor authenticatie uit te schakelen.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <FieldLabel htmlFor="disable-password">Wachtwoord</FieldLabel>
                  <Input
                    id="disable-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={loading}>
                  Annuleren
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={loading || !password}
                >
                  {loading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    "Uitschakelen"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Password step */}
          {step === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>2FA inschakelen</DialogTitle>
                <DialogDescription>
                  Bevestig je wachtwoord om verder te gaan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <FieldLabel htmlFor="enable-password">Wachtwoord</FieldLabel>
                  <Input
                    id="enable-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={loading}>
                  Annuleren
                </Button>
                <Button onClick={handleEnableTwoFactor} disabled={loading || !password}>
                  {loading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    "Doorgaan"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* QR code step */}
          {step === "qr" && totpUri && (
            <>
              <DialogHeader>
                <DialogTitle>Scan de QR code</DialogTitle>
                <DialogDescription>
                  Scan met je authenticator app (bijv. Google Authenticator, 1Password).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <QRCode value={totpUri} size={180} />
                </div>

                {secret && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="w-full"
                  >
                    {secretCopied ? (
                      <>
                        <CheckIcon className="size-4" />
                        Gekopieerd
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-4" />
                        Kopieer setup code
                      </>
                    )}
                  </Button>
                )}

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Voer de 6-cijferige code in:
                  </p>
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => {
                      setOtpCode(value);
                      setError(null);
                    }}
                    disabled={loading}
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
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={loading}>
                  Annuleren
                </Button>
                <Button onClick={handleVerify} disabled={loading || otpCode.length !== 6}>
                  {loading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    "Bevestigen"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Backup codes step */}
          {step === "backup-codes" && (
            <>
              <DialogHeader>
                <DialogTitle>Backup codes</DialogTitle>
                <DialogDescription>
                  Bewaar deze codes veilig. Je kunt ze gebruiken als je geen toegang hebt tot je authenticator app.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex-row justify-between sm:justify-between">
                <Button variant="secondary" onClick={copyBackupCodes}>
                  {copied ? (
                    <>
                      <CheckIcon className="size-4" />
                      Gekopieerd
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-4" />
                      Kopieer
                    </>
                  )}
                </Button>
                <Button onClick={handleComplete}>
                  <CheckIcon className="size-4" />
                  Gereed
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
