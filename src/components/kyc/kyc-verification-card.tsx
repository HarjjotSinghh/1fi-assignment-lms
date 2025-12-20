"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DigiLockerButton } from "./digilocker-button";
import { KycStatusBadge, DocumentVerificationStatus } from "./kyc-status-badge";
import {
  RiShieldCheckLine,
  RiShieldLine,
  RiIdCardLine,
  RiCheckLine,
  RiArrowRightLine,
} from "react-icons/ri";

interface KycVerificationCardProps {
  mode?: "optional" | "required";
  customerId?: string;
  aadhaarVerified?: boolean;
  panVerified?: boolean;
  kycStatus?: string;
  onVerificationComplete?: (status: string) => void;
  onSkip?: () => void;
  className?: string;
}

export function KycVerificationCard({
  mode = "optional",
  customerId,
  aadhaarVerified = false,
  panVerified = false,
  kycStatus = "PENDING",
  onVerificationComplete,
  onSkip,
  className,
}: KycVerificationCardProps) {
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const isFullyVerified = aadhaarVerified && panVerified;

  const handleVerificationComplete = (verificationId: string, status: string) => {
    setVerificationStatus(status);
    onVerificationComplete?.(status);
  };

  if (isFullyVerified) {
    return (
      <Card className={`border-success/20 bg-success/5 ${className}`}>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-none bg-success/10 flex items-center justify-center">
              <RiShieldCheckLine className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-success">KYC Verified</h3>
              <p className="text-sm text-muted-foreground">
                Your Aadhaar and PAN have been successfully verified.
              </p>
            </div>
            <DocumentVerificationStatus 
              aadhaarVerified={aadhaarVerified}
              panVerified={panVerified}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RiShieldLine className="h-5 w-5 text-primary" />
              KYC Verification
              {mode === "required" && (
                <Badge variant="outline" className="text-xs border-warning/30 text-warning">
                  Required
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {mode === "required" 
                ? "Complete KYC verification to proceed with your application"
                : "Verify your identity documents for faster loan processing"
              }
            </CardDescription>
          </div>
          {kycStatus && <KycStatusBadge status={kycStatus} />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Document Status */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 p-3 rounded-none border bg-muted/30">
            <div className={`h-10 w-10 rounded-none flex items-center justify-center ${
              aadhaarVerified ? "bg-success/10" : "bg-muted"
            }`}>
              <RiIdCardLine className={`h-5 w-5 ${
                aadhaarVerified ? "text-success" : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Aadhaar Card</p>
              <p className="text-xs text-muted-foreground">
                {aadhaarVerified ? "Verified via DigiLocker" : "Verification pending"}
              </p>
            </div>
            {aadhaarVerified && (
              <RiCheckLine className="h-5 w-5 text-success" />
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-none border bg-muted/30">
            <div className={`h-10 w-10 rounded-none flex items-center justify-center ${
              panVerified ? "bg-success/10" : "bg-muted"
            }`}>
              <RiIdCardLine className={`h-5 w-5 ${
                panVerified ? "text-success" : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">PAN Card</p>
              <p className="text-xs text-muted-foreground">
                {panVerified ? "Verified via DigiLocker" : "Verification pending"}
              </p>
            </div>
            {panVerified && (
              <RiCheckLine className="h-5 w-5 text-success" />
            )}
          </div>
        </div>

        {/* Verification Actions */}
        {!isFullyVerified && (
          <div className="pt-2 space-y-3">
            <div className="p-4 rounded-none border border-dashed bg-muted/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Verify with DigiLocker</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Securely verify your Aadhaar & PAN through India&apos;s official DigiLocker service.
                    No documents to upload.
                  </p>
                </div>
                <DigiLockerButton
                  documents={["AADHAAR", "PAN"]}
                  customerId={customerId}
                  onVerificationComplete={handleVerificationComplete}
                  variant="default"
                  size="default"
                />
              </div>
            </div>

            {mode === "optional" && onSkip && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  Skip for now
                  <RiArrowRightLine className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {verificationStatus && (
              <div className="text-center py-2">
                <KycStatusBadge status={verificationStatus} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
