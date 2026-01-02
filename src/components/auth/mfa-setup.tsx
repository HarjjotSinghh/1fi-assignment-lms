"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiShieldKeyholeLine, RiLoader4Line, RiCheckLine, RiFileCopyLine } from "react-icons/ri";
import { toast } from "sonner";

interface MfaSetupProps {
    email: string;
    mfaEnabled: boolean;
    onMfaChange: () => void;
}

export function MfaSetup({ email, mfaEnabled, onMfaChange }: MfaSetupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"qr" | "verify" | "backup" | "complete">("qr");
    const [isLoading, setIsLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const startSetup = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/auth/mfa/setup", {
                method: "POST",
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to start MFA setup");
            }

            setQrCodeUrl(data.qrCodeUrl);
            setSecret(data.secret);
            setStep("qr");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start MFA setup");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyCode = async () => {
        if (verificationCode.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/auth/mfa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: verificationCode, secret }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid verification code");
            }

            setBackupCodes(data.backupCodes);
            setStep("backup");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const completeSetup = () => {
        setStep("complete");
        onMfaChange();
        toast.success("MFA enabled successfully");
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join("\n"));
        toast.success("Backup codes copied to clipboard");
    };

    const disableMfa = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/mfa/disable", {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to disable MFA");
            }

            onMfaChange();
            toast.success("MFA disabled");
            setIsOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to disable MFA");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && !mfaEnabled) {
            startSetup();
        }
        if (!open) {
            // Reset state when closing
            setStep("qr");
            setVerificationCode("");
            setError(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RiShieldKeyholeLine className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={mfaEnabled ? "default" : "secondary"}>
                        {mfaEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button variant={mfaEnabled ? "outline" : "default"}>
                            {mfaEnabled ? "Manage MFA" : "Enable MFA"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {mfaEnabled ? "Two-Factor Authentication" : "Set Up MFA"}
                            </DialogTitle>
                            <DialogDescription>
                                {mfaEnabled
                                    ? "Manage your two-factor authentication settings"
                                    : "Scan the QR code with your authenticator app"}
                            </DialogDescription>
                        </DialogHeader>

                        {mfaEnabled ? (
                            <div className="space-y-4">
                                <Alert>
                                    <RiCheckLine className="h-4 w-4" />
                                    <AlertDescription>
                                        Two-factor authentication is currently enabled for your account.
                                    </AlertDescription>
                                </Alert>
                                <Button
                                    variant="destructive"
                                    onClick={disableMfa}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <RiLoader4Line className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Disable MFA
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {step === "qr" && qrCodeUrl && (
                                    <>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative w-64 h-64 bg-white rounded-lg p-2">
                                                <Image
                                                    src={qrCodeUrl}
                                                    alt="MFA QR Code"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground text-center">
                                                Scan this QR code with Google Authenticator, Authy, or similar app
                                            </p>
                                            {secret && (
                                                <p className="text-xs font-mono bg-muted p-2 rounded">
                                                    Manual entry: {secret}
                                                </p>
                                            )}
                                        </div>
                                        <Button onClick={() => setStep("verify")} className="w-full">
                                            Continue
                                        </Button>
                                    </>
                                )}

                                {step === "verify" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Verification Code</Label>
                                            <Input
                                                id="code"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                                placeholder="Enter 6-digit code"
                                                value={verificationCode}
                                                onChange={(e) =>
                                                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                                                }
                                                className="text-center text-2xl tracking-widest"
                                            />
                                        </div>
                                        <Button
                                            onClick={verifyCode}
                                            disabled={isLoading || verificationCode.length !== 6}
                                            className="w-full"
                                        >
                                            {isLoading ? (
                                                <RiLoader4Line className="h-4 w-4 animate-spin mr-2" />
                                            ) : null}
                                            Verify & Enable
                                        </Button>
                                    </>
                                )}

                                {step === "backup" && (
                                    <>
                                        <Alert>
                                            <AlertDescription>
                                                Save these backup codes in a safe place. You can use them to access
                                                your account if you lose access to your authenticator app.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-muted p-4 rounded-lg">
                                            {backupCodes.map((code, i) => (
                                                <div key={i} className="text-center py-1">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="outline" onClick={copyBackupCodes} className="w-full">
                                            <RiFileCopyLine className="h-4 w-4 mr-2" />
                                            Copy Codes
                                        </Button>
                                        <Button onClick={completeSetup} className="w-full">
                                            I&apos;ve Saved My Codes
                                        </Button>
                                    </>
                                )}

                                {step === "complete" && (
                                    <div className="text-center space-y-4">
                                        <div className="flex justify-center">
                                            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                                <RiCheckLine className="h-8 w-8 text-green-600" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-medium">MFA Enabled Successfully</p>
                                        <Button onClick={() => setIsOpen(false)} className="w-full">
                                            Done
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
