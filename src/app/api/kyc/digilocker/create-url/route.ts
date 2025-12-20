import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    createDigiLockerUrl,
    generateVerificationId,
    isCashfreeConfigured,
    type DocumentType,
    type UserFlow,
} from "@/lib/cashfree";

export async function POST(request: Request) {
    try {
        // Check if Cashfree is configured
        if (!isCashfreeConfigured()) {
            return NextResponse.json(
                { error: "Cashfree API credentials not configured" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const {
            documents = ["AADHAAR", "PAN"] as DocumentType[],
            customerId,
            userFlow = "signup" as UserFlow,
        } = body;

        // Validate documents
        const validDocs: DocumentType[] = ["AADHAAR", "PAN", "DRIVING_LICENSE"];
        const requestedDocs = documents.filter((d: string) => validDocs.includes(d as DocumentType)) as DocumentType[];

        if (requestedDocs.length === 0) {
            return NextResponse.json(
                { error: "At least one valid document type is required (AADHAAR, PAN, DRIVING_LICENSE)" },
                { status: 400 }
            );
        }

        // If customerId provided, verify customer exists
        if (customerId) {
            const customer = await db
                .select()
                .from(customers)
                .where(eq(customers.id, customerId))
                .limit(1);

            if (customer.length === 0) {
                return NextResponse.json(
                    { error: "Customer not found" },
                    { status: 404 }
                );
            }
        }

        // Generate verification ID
        const verificationId = generateVerificationId();

        // Build redirect URL
        const appUrl = "https://1fi-assignment-lms.vercel.app";
        const redirectUrl = `${appUrl}/api/kyc/digilocker/callback?verification_id=${verificationId}`;

        // Create DigiLocker URL via Cashfree
        const response = await createDigiLockerUrl({
            verificationId,
            documents: requestedDocs,
            redirectUrl,
            userFlow,
        });

        // Calculate URL expiry (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Store verification record
        await db.insert(kycVerifications).values({
            verificationId: response.verification_id,
            referenceId: response.reference_id,
            documentsRequested: JSON.stringify(response.document_requested),
            redirectUrl: response.redirect_url,
            digilockerUrl: response.url,
            userFlow: response.user_flow,
            status: response.status,
            expiresAt,
            customerId: customerId || null,
        });

        return NextResponse.json({
            success: true,
            verificationId: response.verification_id,
            referenceId: response.reference_id,
            url: response.url,
            status: response.status,
            documentsRequested: response.document_requested,
            expiresAt,
        });

    } catch (error) {
        console.error("Error creating DigiLocker URL:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create verification URL" },
            { status: 500 }
        );
    }
}
