"use server";

import { db } from "@/db";
import { legalCases, loans } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createLegalCase(data: {
    caseNumber: string;
    courtName: string;
    caseType: string;
    loanId: string;
    filingDate: string;
    claimAmount: number;
    assignedToId?: string;
    nextHearingDate?: string;
    notes?: string;
    status: "FILED" | "HEARING_SCHEDULED" | "ORDER_PASSED" | "CLOSED";
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Fetch loan to get customerId
        const loan = await db.query.loans.findFirst({
            where: eq(loans.id, data.loanId),
            columns: { customerId: true }
        });

        if (!loan) {
            return { success: false, error: "Loan not found" };
        }

        await db.insert(legalCases).values({
            ...data,
            customerId: loan.customerId,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        revalidatePath("/legal");
        return { success: true };
    } catch (error) {
        console.error("Error creating legal case:", error);
        return { success: false, error: "Failed to create legal case" };
    }
}
