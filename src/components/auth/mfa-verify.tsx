"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiShieldKeyholeLine, RiLoader4Line, RiKeyLine } from "react-icons/ri";

interface MfaVerifyProps {
    onVerified: () => void;
    onCancel?: () => void;
    email: string;
}

export function MfaVerify({ onVerified, onCancel, email }: MfaVerifyProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useBackupCode, setUseBackupCode] = useState(false);

    const handleVerify = async () => {
        if (!useBackupCode && code.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        if (useBackupCode && code.length < 8) {
            setError("Please enter a valid backup code");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/mfa/challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code.replace(/[-\s]/g, ""),
                    isBackupCode: useBackupCode,
                    email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Verification failed");
            }

            onVerified();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleVerify();
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <RiShieldKeyholeLine className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                    {useBackupCode
                        ? "Enter one of your backup codes"
                        : "Enter the code from your authenticator app"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="mfa-code">
                        {useBackupCode ? "Backup Code" : "Verification Code"}
                    </Label>
                    <Input
                        id="mfa-code"
                        type="text"
                        inputMode={useBackupCode ? "text" : "numeric"}
                        pattern={useBackupCode ? undefined : "[0-9]*"}
                        maxLength={useBackupCode ? 9 : 6}
                        placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                        value={code}
                        onChange={(e) => {
                            if (useBackupCode) {
                                setCode(e.target.value.toUpperCase());
                            } else {
                                setCode(e.target.value.replace(/\D/g, ""));
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        className="text-center text-2xl tracking-widest"
                        autoFocus
                    />
                </div>

                <Button
                    onClick={handleVerify}
                    disabled={isLoading || (useBackupCode ? code.length < 8 : code.length !== 6)}
                    className="w-full"
                >
                    {isLoading ? (
                        <RiLoader4Line className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Verify
                </Button>

                <div className="flex items-center justify-center">
                    <Button
                        variant="link"
                        onClick={() => {
                            setUseBackupCode(!useBackupCode);
                            setCode("");
                            setError(null);
                        }}
                        className="text-sm"
                    >
                        <RiKeyLine className="h-4 w-4 mr-1" />
                        {useBackupCode ? "Use authenticator app" : "Use a backup code"}
                    </Button>
                </div>

                {onCancel && (
                    <Button variant="ghost" onClick={onCancel} className="w-full">
                        Cancel
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
