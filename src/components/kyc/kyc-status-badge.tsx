"use client";

import { cn } from "@/lib/utils";
import { 
  RiCheckLine, 
  RiTimeLine, 
  RiCloseLine,
  RiShieldCheckLine,
} from "react-icons/ri";

type KycStatus = "PENDING" | "IN_PROGRESS" | "VERIFIED" | "AUTHENTICATED" | "EXPIRED" | "CONSENT_DENIED" | "REJECTED";

interface KycStatusBadgeProps {
  status: KycStatus | string;
  documentType?: "AADHAAR" | "PAN" | null;
  className?: string;
}

const statusConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  className: string 
}> = {
  PENDING: {
    label: "Pending",
    icon: RiTimeLine,
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: RiTimeLine,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  VERIFIED: {
    label: "Verified",
    icon: RiCheckLine,
    className: "bg-success/10 text-success border-success/20",
  },
  AUTHENTICATED: {
    label: "Verified",
    icon: RiCheckLine,
    className: "bg-success/10 text-success border-success/20",
  },
  EXPIRED: {
    label: "Expired",
    icon: RiCloseLine,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  CONSENT_DENIED: {
    label: "Denied",
    icon: RiCloseLine,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: RiCloseLine,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function KycStatusBadge({ status, documentType, className }: KycStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>
        {documentType && `${documentType} `}
        {config.label}
      </span>
    </div>
  );
}

interface DocumentVerificationStatusProps {
  aadhaarVerified?: boolean;
  panVerified?: boolean;
  className?: string;
}

export function DocumentVerificationStatus({ 
  aadhaarVerified, 
  panVerified,
  className 
}: DocumentVerificationStatusProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "flex items-center gap-1.5 text-xs",
        aadhaarVerified ? "text-success" : "text-muted-foreground"
      )}>
        {aadhaarVerified ? (
          <RiShieldCheckLine className="h-4 w-4" />
        ) : (
          <RiTimeLine className="h-4 w-4" />
        )}
        <span>Aadhaar</span>
      </div>
      <div className={cn(
        "flex items-center gap-1.5 text-xs",
        panVerified ? "text-success" : "text-muted-foreground"
      )}>
        {panVerified ? (
          <RiShieldCheckLine className="h-4 w-4" />
        ) : (
          <RiTimeLine className="h-4 w-4" />
        )}
        <span>PAN</span>
      </div>
    </div>
  );
}
