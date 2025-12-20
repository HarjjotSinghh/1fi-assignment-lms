"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  RiExternalLinkLine, 
  RiLoader4Line,
  RiRefreshLine,
} from "react-icons/ri";
import { toast } from "sonner";

type DocumentType = "AADHAAR" | "PAN" | "DRIVING_LICENSE";

interface DigiLockerButtonProps {
  documents?: DocumentType[];
  customerId?: string;
  onVerificationCreated?: (verificationId: string, url: string) => void;
  onVerificationComplete?: (verificationId: string, status: string) => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function DigiLockerButton({
  documents = ["AADHAAR", "PAN"],
  customerId,
  onVerificationCreated,
  onVerificationComplete,
  disabled = false,
  variant = "default",
  size = "default",
  className,
  children,
}: DigiLockerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for verification status
  const pollStatus = useCallback(async (verId: string) => {
    try {
      const response = await fetch(
        `/api/kyc/digilocker/status?verification_id=${verId}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.status === "AUTHENTICATED") {
          setIsPolling(false);
          onVerificationComplete?.(verId, data.status);
          toast.success("Verification completed!", {
            description: "Your documents have been verified successfully.",
          });
          return true;
        } else if (data.status === "EXPIRED" || data.status === "CONSENT_DENIED") {
          setIsPolling(false);
          onVerificationComplete?.(verId, data.status);
          toast.error("Verification failed", {
            description: data.status === "EXPIRED" 
              ? "The verification link has expired." 
              : "Consent was denied.",
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error polling status:", error);
      return false;
    }
  }, [onVerificationComplete]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || !verificationId) return;

    const interval = setInterval(async () => {
      const completed = await pollStatus(verificationId);
      if (completed) {
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes (URL expiry)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isPolling, verificationId, pollStatus]);

  const initiateVerification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/kyc/digilocker/create-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents,
          customerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create verification URL");
      }

      setVerificationId(data.verificationId);
      onVerificationCreated?.(data.verificationId, data.url);

      // Open DigiLocker in new window
      window.open(data.url, "_blank", "noopener,noreferrer");

      // Start polling
      setIsPolling(true);

      toast.success("DigiLocker opened", {
        description: "Complete verification in the new window. This page will update automatically.",
      });

    } catch (error) {
      toast.error("Failed to start verification", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!verificationId) return;
    setIsLoading(true);
    await pollStatus(verificationId);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={initiateVerification}
        disabled={disabled || isLoading || isPolling}
        className={className}
      >
        {isLoading ? (
          <RiLoader4Line className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RiExternalLinkLine className="h-4 w-4 mr-2" />
        )}
        {children || "Verify with DigiLocker"}
      </Button>

      {isPolling && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={isLoading}
        >
          <RiRefreshLine className={`h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  );
}
