import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    getDocument,
    isCashfreeConfigured,
    type DocumentType,
    type AadhaarDocument,
    type PanDocument,
} from "@/lib/cashfree";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params;
        const documentType = type.toUpperCase() as DocumentType;

        // Validate document type
        const validTypes: DocumentType[] = ["AADHAAR", "PAN", "DRIVING_LICENSE"];
        if (!validTypes.includes(documentType)) {
            return NextResponse.json(
                { error: "Invalid document type. Must be AADHAAR, PAN, or DRIVING_LICENSE" },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const verificationId = searchParams.get("verification_id");
        const referenceId = searchParams.get("reference_id");

        if (!verificationId && !referenceId) {
            return NextResponse.json(
                { error: "Either verification_id or reference_id is required" },
                { status: 400 }
            );
        }

        // Check if Cashfree is configured
        if (!isCashfreeConfigured()) {
            return NextResponse.json(
                { error: "Cashfree API credentials not configured" },
                { status: 503 }
            );
        }

        // Verify the verification exists and is authenticated
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

        if (verification.status !== "AUTHENTICATED") {
            return NextResponse.json(
                { error: "Verification not completed. User must complete DigiLocker verification first." },
                { status: 400 }
            );
        }

        // Check if the document was consented
        const consentedDocs = verification.documentsConsented
            ? JSON.parse(verification.documentsConsented) as string[]
            : [];

        if (!consentedDocs.includes(documentType)) {
            return NextResponse.json(
                { error: `User did not consent to share ${documentType}` },
                { status: 400 }
            );
        }

        // Fetch document from Cashfree
        const document = await getDocument(documentType, {
            verificationId: verification.verificationId,
        });

        // If we have a customerId, update their KYC status
        if (verification.customerId) {
            const updateData: Record<string, unknown> = {
                updatedAt: new Date().toISOString(),
            };

            if (documentType === "AADHAAR") {
                const aadhaarDoc = document as AadhaarDocument;
                if (aadhaarDoc.status === "SUCCESS") {
                    updateData.aadhaarVerified = true;
                    updateData.aadhaarVerifiedAt = new Date().toISOString();
                    // Don't store full Aadhaar number, just mark as verified
                }
            } else if (documentType === "PAN") {
                const panDoc = document as PanDocument;
                if (panDoc.status === "SUCCESS" || panDoc.pan) {
                    updateData.panVerified = true;
                    updateData.panVerifiedAt = new Date().toISOString();
                    updateData.panNumber = panDoc.pan;
                }
            }

            // Check if both are verified to update KYC status
            const customer = await db
                .select()
                .from(customers)
                .where(eq(customers.id, verification.customerId))
                .limit(1);

            if (customer.length > 0) {
                const existingCustomer = customer[0];
                const willHaveAadhaar = documentType === "AADHAAR" || existingCustomer.aadhaarVerified;
                const willHavePan = documentType === "PAN" || existingCustomer.panVerified;

                if (willHaveAadhaar && willHavePan) {
                    updateData.kycStatus = "VERIFIED";
                } else {
                    updateData.kycStatus = "IN_PROGRESS";
                }

                await db
                    .update(customers)
                    .set(updateData)
                    .where(eq(customers.id, verification.customerId));
            }
        }

        return NextResponse.json({
            success: true,
            documentType,
            document,
        });

    } catch (error) {
        console.error("Error fetching document:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch document" },
            { status: 500 }
        );
    }
}
