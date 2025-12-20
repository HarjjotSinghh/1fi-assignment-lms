import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    getVerificationStatus as getCashfreeStatus,
    isCashfreeConfigured,
} from "@/lib/cashfree";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const verificationId = searchParams.get("verification_id");
        const referenceId = searchParams.get("reference_id");

        if (!verificationId && !referenceId) {
            return NextResponse.json(
                { error: "Either verification_id or reference_id is required" },
                { status: 400 }
            );
        }

        // First check our database
        let verification = null;
        if (verificationId) {
            const result = await db
                .select()
                .from(kycVerifications)
                .where(eq(kycVerifications.verificationId, verificationId))
                .limit(1);
            verification = result[0];
        } else if (referenceId) {
            const result = await db
                .select()
                .from(kycVerifications)
                .where(eq(kycVerifications.referenceId, parseInt(referenceId)))
                .limit(1);
            verification = result[0];
        }

        if (!verification) {
            return NextResponse.json(
                { error: "Verification not found" },
                { status: 404 }
            );
        }

        // If status is still pending and Cashfree is configured, fetch latest status
        if (verification.status === "PENDING" && isCashfreeConfigured()) {
            try {
                const cashfreeStatus = await getCashfreeStatus({
                    verificationId: verification.verificationId,
                });

                // Update local record if status changed
                if (cashfreeStatus.status !== verification.status) {
                    await db
                        .update(kycVerifications)
                        .set({
                            status: cashfreeStatus.status,
                            userName: cashfreeStatus.user_details?.name || null,
                            userDob: cashfreeStatus.user_details?.dob || null,
                            userGender: cashfreeStatus.user_details?.gender || null,
                            userMobile: cashfreeStatus.user_details?.mobile || null,
                            documentsConsented: cashfreeStatus.document_consent
                                ? JSON.stringify(cashfreeStatus.document_consent)
                                : null,
                            consentExpiresAt: cashfreeStatus.document_consent_validity || null,
                            completedAt: cashfreeStatus.status === "AUTHENTICATED"
                                ? new Date().toISOString()
                                : null,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(kycVerifications.id, verification.id));

                    // Update local object
                    verification = {
                        ...verification,
                        status: cashfreeStatus.status,
                        userName: cashfreeStatus.user_details?.name || null,
                        userDob: cashfreeStatus.user_details?.dob || null,
                        userGender: cashfreeStatus.user_details?.gender || null,
                        userMobile: cashfreeStatus.user_details?.mobile || null,
                    };
                }
            } catch (error) {
                console.error("Error fetching Cashfree status:", error);
                // Continue with local status if Cashfree call fails
            }
        }

        // Check if URL has expired
        const isExpired = verification.expiresAt && new Date(verification.expiresAt) < new Date();
        if (isExpired && verification.status === "PENDING") {
            await db
                .update(kycVerifications)
                .set({
                    status: "EXPIRED",
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(kycVerifications.id, verification.id));

            verification = { ...verification, status: "EXPIRED" };
        }

        return NextResponse.json({
            success: true,
            verificationId: verification.verificationId,
            referenceId: verification.referenceId,
            status: verification.status,
            documentsRequested: JSON.parse(verification.documentsRequested),
            documentsConsented: verification.documentsConsented
                ? JSON.parse(verification.documentsConsented)
                : null,
            userDetails: verification.status === "AUTHENTICATED" ? {
                name: verification.userName,
                dob: verification.userDob,
                gender: verification.userGender,
                mobile: verification.userMobile,
            } : null,
            consentExpiresAt: verification.consentExpiresAt,
            expiresAt: verification.expiresAt,
            completedAt: verification.completedAt,
            customerId: verification.customerId,
        });

    } catch (error) {
        console.error("Error getting verification status:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get verification status" },
            { status: 500 }
        );
    }
}
