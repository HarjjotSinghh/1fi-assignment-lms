"use server";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function verifyDocumentAction(documentId: string, isVerified: boolean, applicationId: string) {
    try {
        await db
            .update(documents)
            .set({
                verified: isVerified,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(documents.id, documentId));

        revalidatePath(`/applications/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to verify document:", error);
        return { success: false, error: "Failed to verify document" };
    }
}

export async function uploadDocumentAction(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;
        const name = formData.get("name") as string;
        const customerId = formData.get("customerId") as string;
        const applicationId = formData.get("applicationId") as string | null;
        const loanId = formData.get("loanId") as string | null;

        if (!file) throw new Error("No file provided");

        // Mock upload - in real world this would go to S3/Blob
        // For now we'll just store a fake URL
        const mockUrl = `https://storage.googleapis.com/lms-uploads/${Date.now()}-${file.name}`;

        await db.insert(documents).values({
            name: name || file.name,
            type: type,
            url: mockUrl,
            customerId: customerId,
            applicationId: applicationId || null,
            loanId: loanId || null,
            verified: false,
        });

        if (applicationId) revalidatePath(`/applications/${applicationId}`);
        if (loanId) revalidatePath(`/loans/${loanId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to upload document:", error);
        return { success: false, error: "Failed to upload document" };
    }
}

export async function deleteDocumentAction(documentId: string, path: string) {
    try {
        await db.delete(documents).where(eq(documents.id, documentId));
        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete document:", error);
        return { success: false, error: "Failed to delete document" };
    }
}
