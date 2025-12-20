import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Callback endpoint for DigiLocker redirect
 * DigiLocker redirects here after user completes/cancels verification
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get("verification_id");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Default redirect to dashboard with error
    if (!verificationId) {
        return NextResponse.redirect(
            `${appUrl}/dashboard?kyc_error=missing_verification_id`
        );
    }

    try {
        // Find the verification record
        const verification = await db
            .select()
            .from(kycVerifications)
            .where(eq(kycVerifications.verificationId, verificationId))
            .limit(1);

        if (verification.length === 0) {
            return NextResponse.redirect(
                `${appUrl}/dashboard?kyc_error=verification_not_found`
            );
        }

        const record = verification[0];

        // Check if status is PENDING, if so fetch latest status
        if (record.status === "PENDING") {
            try {
                const { getVerificationStatus, getDocument } = await import("@/lib/cashfree");

                const cashfreeStatus = await getVerificationStatus({
                    verificationId: verificationId,
                });

                if (cashfreeStatus.status === "AUTHENTICATED") {
                    // Fetch documents
                    let aadhaarNumber = null;
                    let panNumber = null;
                    let userName = cashfreeStatus.user_details?.name;
                    let userDob = cashfreeStatus.user_details?.dob;
                    let userGender = cashfreeStatus.user_details?.gender;
                    let userMobile = cashfreeStatus.user_details?.mobile;

                    // Try to fetch Aadhaar if consented
                    if (cashfreeStatus.document_consent?.includes("AADHAAR")) {
                        try {
                            const aadhaarDoc = await getDocument("AADHAAR", { verificationId });
                            if ('uid' in aadhaarDoc) {
                                aadhaarNumber = aadhaarDoc.uid;
                                // Prefer document details if available
                                if (aadhaarDoc.name) userName = aadhaarDoc.name;
                                if (aadhaarDoc.dob) userDob = aadhaarDoc.dob;
                                if (aadhaarDoc.gender) userGender = aadhaarDoc.gender;
                            }
                        } catch (e) {
                            console.error("Failed to fetch Aadhaar details", e);
                        }
                    }

                    // Try to fetch PAN if consented
                    if (cashfreeStatus.document_consent?.includes("PAN")) {
                        try {
                            const panDoc = await getDocument("PAN", { verificationId });
                            if ('pan' in panDoc) {
                                panNumber = panDoc.pan;
                                // Fallback name/dob if not from Aadhaar
                                if (!userName && panDoc.name) userName = panDoc.name;
                                if (!userDob && panDoc.dob) userDob = panDoc.dob;
                            }
                        } catch (e) {
                            console.error("Failed to fetch PAN details", e);
                        }
                    }

                    // Update verification record
                    await db.update(kycVerifications)
                        .set({
                            status: "AUTHENTICATED",
                            userName,
                            userDob,
                            userGender,
                            userMobile,
                            aadhaarNumber,
                            panNumber,
                            documentsConsented: JSON.stringify(cashfreeStatus.document_consent),
                            consentExpiresAt: cashfreeStatus.document_consent_validity,
                            completedAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(kycVerifications.id, record.id));

                    // Update local record for redirect logic
                    record.status = "AUTHENTICATED";
                } else if (cashfreeStatus.status !== record.status) {
                    // Update other status changes
                    await db.update(kycVerifications)
                        .set({
                            status: cashfreeStatus.status,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(kycVerifications.id, record.id));

                    record.status = cashfreeStatus.status as any;
                }
            } catch (error) {
                console.error("Error updating verification status in callback:", error);
            }
        }

        // Determine redirect based on context
        const redirectParams = new URLSearchParams({
            kyc_verification: verificationId,
            kyc_status: record.status,
        });

        const redirectUrl = record.customerId
            ? `${appUrl}/applications/new?${redirectParams.toString()}`
            : `${appUrl}/onboarding?${redirectParams.toString()}`;

        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("Error processing DigiLocker callback:", error);
        return NextResponse.redirect(
            `${appUrl}/dashboard?kyc_error=callback_failed`
        );
    }
}
