import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DigiLockerWebhookPayload } from "@/lib/cashfree";

export async function POST(request: Request) {
    try {
        const payload = await request.json() as DigiLockerWebhookPayload;

        console.log("DigiLocker Webhook received:", JSON.stringify(payload, null, 2));

        const { event_type, data } = payload;

        if (!data?.verification_id) {
            return NextResponse.json(
                { error: "Missing verification_id in webhook payload" },
                { status: 400 }
            );
        }

        // Find the verification record
        const verification = await db
            .select()
            .from(kycVerifications)
            .where(eq(kycVerifications.verificationId, data.verification_id))
            .limit(1);

        if (verification.length === 0) {
            console.error("Verification not found for webhook:", data.verification_id);
            return NextResponse.json(
                { error: "Verification not found" },
                { status: 404 }
            );
        }

        const record = verification[0];

        // Map event type to status
        let status: string = record.status;
        switch (event_type) {
            case "DIGILOCKER_VERIFICATION_SUCCESS":
                status = "AUTHENTICATED";
                break;
            case "DIGILOCKER_VERIFICATION_LINK_EXPIRED":
                status = "EXPIRED";
                break;
            case "DIGILOCKER_VERIFICATION_CONSENT_DENIED":
            case "DIGILOCKER_VERIFICATION_CONSENT_EXPIRED":
                status = "CONSENT_DENIED";
                break;
            case "DIGILOCKER_VERIFICATION_FAILURE":
                status = "EXPIRED";
                break;
        }

        // Update verification record
        await db
            .update(kycVerifications)
            .set({
                status,
                userName: data.user_details?.name || null,
                userDob: data.user_details?.dob || null,
                userGender: data.user_details?.gender || null,
                userMobile: data.user_details?.mobile || null,
                documentsConsented: data.document_consent
                    ? JSON.stringify(data.document_consent)
                    : null,
                consentExpiresAt: data.document_consent_validity || null,
                completedAt: status === "AUTHENTICATED" ? new Date().toISOString() : null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(kycVerifications.id, record.id));

        // If verification successful and linked to a customer, update customer KYC status
        if (status === "AUTHENTICATED" && record.customerId) {
            await db
                .update(customers)
                .set({
                    kycStatus: "IN_PROGRESS",
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(customers.id, record.customerId));
        }

        console.log(`DigiLocker verification ${data.verification_id} updated to status: ${status}`);

        return NextResponse.json({
            success: true,
            message: "Webhook processed successfully",
        });

    } catch (error) {
        console.error("Error processing DigiLocker webhook:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process webhook" },
            { status: 500 }
        );
    }
}
