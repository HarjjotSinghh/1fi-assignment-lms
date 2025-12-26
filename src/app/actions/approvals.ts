"use server";

import { db } from "@/db";
import { approvals, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPendingApprovalsAction() {
    try {
        const data = await db
            .select({
                id: approvals.id,
                type: approvals.type,
                entityType: approvals.entityType,
                entityId: approvals.entityId,
                requestedAmount: approvals.requestedAmount,
                notes: approvals.notes,
                createdAt: approvals.createdAt,
                requestedBy: users.name,
            })
            .from(approvals)
            .leftJoin(users, eq(approvals.requestedById, users.id))
            .where(eq(approvals.status, "PENDING"))
            .orderBy(desc(approvals.createdAt));

        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch approvals:", error);
        return { success: false, error: "Failed to fetch approvals" };
    }
}

export async function processApprovalAction(id: string, status: "APPROVED" | "REJECTED", comment: string, reviewerId: string) {
    try {
        await db
            .update(approvals)
            .set({
                status,
                reviewComment: comment,
                reviewedById: reviewerId,
                reviewedAt: new Date().toISOString(),
            })
            .where(eq(approvals.id, id));

        // In a real system, this would trigger the next step (e.g., disbursing funds, updating loan status)
        // For now, we just update the approval record.

        revalidatePath("/approvals");
        return { success: true };
    } catch (error) {
        console.error("Failed to process approval:", error);
        return { success: false, error: "Failed to process approval" };
    }
}
