import { db } from "@/db";
import { auditLogs, type NewAuditLog } from "@/db/schema";

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "REJECT"
    | "DISBURSE"
    | "EXPORT"
    | "LOGIN"
    | "LOGOUT"
    | "KYC_VERIFY"
    | "COLLATERAL_PLEDGE"
    | "COLLATERAL_RELEASE"
    | "PAYMENT_RECEIVED";

export type AuditEntityType =
    | "LOAN"
    | "APPLICATION"
    | "CUSTOMER"
    | "COLLATERAL"
    | "PRODUCT"
    | "USER"
    | "PAYMENT"
    | "DOCUMENT";

interface LogAuditParams {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    description: string;
    metadata?: Record<string, unknown>;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log a compliance-relevant audit action
 * Use this for significant operations that need an audit trail
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
    try {
        const auditEntry: NewAuditLog = {
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            description: params.description,
            metadata: params.metadata ? JSON.stringify(params.metadata) : null,
            userId: params.userId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        };

        await db.insert(auditLogs).values(auditEntry);
    } catch (error) {
        // Log to console but don't throw - audit logging shouldn't break main flows
        console.error("Failed to log audit entry:", error);
    }
}

/**
 * Helper to extract client info from request headers
 */
export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    return { ipAddress, userAgent };
}

/**
 * Log application creation
 */
export async function logApplicationCreated(
    applicationId: string,
    customerId: string,
    amount: number,
    userId?: string
): Promise<void> {
    await logAudit({
        action: "CREATE",
        entityType: "APPLICATION",
        entityId: applicationId,
        description: `New loan application created for amount ₹${amount.toLocaleString()}`,
        metadata: { customerId, amount },
        userId,
    });
}

/**
 * Log application status change
 */
export async function logApplicationStatusChange(
    applicationId: string,
    oldStatus: string,
    newStatus: string,
    userId?: string,
    comment?: string
): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
        APPROVED: "APPROVE",
        REJECTED: "REJECT",
        DISBURSED: "DISBURSE",
    };

    await logAudit({
        action: actionMap[newStatus] || "UPDATE",
        entityType: "APPLICATION",
        entityId: applicationId,
        description: `Application status changed from ${oldStatus} to ${newStatus}`,
        metadata: { oldStatus, newStatus, comment },
        userId,
    });
}

/**
 * Log loan disbursement
 */
export async function logLoanDisbursed(
    loanId: string,
    applicationId: string,
    amount: number,
    customerId: string,
    userId?: string
): Promise<void> {
    await logAudit({
        action: "DISBURSE",
        entityType: "LOAN",
        entityId: loanId,
        description: `Loan disbursed for ₹${amount.toLocaleString()}`,
        metadata: { applicationId, amount, customerId },
        userId,
    });
}

/**
 * Log customer KYC verification
 */
export async function logKycVerified(
    customerId: string,
    verificationType: "AADHAAR" | "PAN" | "BOTH",
    userId?: string
): Promise<void> {
    await logAudit({
        action: "KYC_VERIFY",
        entityType: "CUSTOMER",
        entityId: customerId,
        description: `KYC ${verificationType} verification completed`,
        metadata: { verificationType },
        userId,
    });
}

/**
 * Log collateral pledge
 */
export async function logCollateralPledged(
    collateralId: string,
    loanId: string,
    value: number,
    userId?: string
): Promise<void> {
    await logAudit({
        action: "COLLATERAL_PLEDGE",
        entityType: "COLLATERAL",
        entityId: collateralId,
        description: `Collateral pledged with value ₹${value.toLocaleString()}`,
        metadata: { loanId, value },
        userId,
    });
}

/**
 * Log data export for compliance
 */
export async function logDataExport(
    entityType: AuditEntityType,
    format: "CSV" | "PDF",
    recordCount: number,
    userId?: string
): Promise<void> {
    await logAudit({
        action: "EXPORT",
        entityType,
        description: `Exported ${recordCount} ${entityType.toLowerCase()} records as ${format}`,
        metadata: { format, recordCount },
        userId,
    });
}

/**
 * Log payment received
 */
export async function logPaymentReceived(
    paymentId: string,
    loanId: string,
    amount: number,
    userId?: string
): Promise<void> {
    await logAudit({
        action: "PAYMENT_RECEIVED",
        entityType: "PAYMENT",
        entityId: paymentId,
        description: `Payment of ₹${amount.toLocaleString()} received`,
        metadata: { loanId, amount },
        userId,
    });
}
