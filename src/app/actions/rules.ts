"use server";

import { db } from "@/db";
import { autoApprovalRules } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getRules() {
    try {
        const rules = await db.query.autoApprovalRules.findMany({
            orderBy: [desc(autoApprovalRules.priority), desc(autoApprovalRules.createdAt)],
            with: {
                product: true
            }
        });
        return { success: true, data: rules };
    } catch (error) {
        console.error("Error fetching rules:", error);
        return { success: false, error: "Failed to fetch rules" };
    }
}

export async function createRule(data: {
    name: string;
    description?: string;
    priority: number;
    conditions: string; // JSON string
    autoApprove: boolean;
    autoReject: boolean;
    productId?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const [newRule] = await db.insert(autoApprovalRules).values({
            ...data,
            createdById: session.user.id,
            isActive: true,
        }).returning();

        revalidatePath("/configuration/rules");
        return { success: true, data: newRule };
    } catch (error) {
        console.error("Error creating rule:", error);
        return { success: false, error: "Failed to create rule" };
    }
}

export async function toggleRuleActive(id: string, currentStatus: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const [updatedRule] = await db.update(autoApprovalRules)
            .set({
                isActive: !currentStatus,
                updatedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(autoApprovalRules.id, id))
            .returning();

        revalidatePath("/configuration/rules");
        return { success: true, data: updatedRule };
    } catch (error) {
        console.error("Error toggling rule:", error);
        return { success: false, error: "Failed to toggle rule" };
    }
}

export async function deleteRule(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.delete(autoApprovalRules).where(eq(autoApprovalRules.id, id));

        revalidatePath("/configuration/rules");
        return { success: true };
    } catch (error) {
        console.error("Error deleting rule:", error);
        return { success: false, error: "Failed to delete rule" };
    }
}

export async function getProducts() {
    try {
        const products = await db.query.loanProducts.findMany();
        return { success: true, data: products };
    } catch (error) {
        return { success: false, error: "Failed to fetch products" };
    }
}
