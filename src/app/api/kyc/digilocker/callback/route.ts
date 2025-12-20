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

        // Determine redirect based on context
        // If there's a customerId, redirect to onboarding or applications
        if (record.customerId) {
            return NextResponse.redirect(
                `${appUrl}/applications/new?kyc_verification=${verificationId}&kyc_status=${record.status}`
            );
        }

        // For general verification, redirect to onboarding
        return NextResponse.redirect(
            `${appUrl}/onboarding?kyc_verification=${verificationId}&kyc_status=${record.status}`
        );

    } catch (error) {
        console.error("Error processing DigiLocker callback:", error);
        return NextResponse.redirect(
            `${appUrl}/dashboard?kyc_error=callback_failed`
        );
    }
}
