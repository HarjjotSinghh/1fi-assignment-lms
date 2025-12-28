"use server";

import { db } from "@/db";
import {
    recoveryAgents,
    recoveryAssignments,
    loans,
    customers,
    legalCases
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecoveryAgents() {
    try {
        const agents = await db.query.recoveryAgents.findMany({
            orderBy: [desc(recoveryAgents.createdAt)],
        });
        return { success: true, data: agents };
    } catch (error) {
        console.error("Error fetching recovery agents:", error);
        return { success: false, error: "Failed to fetch recovery agents" };
    }
}

export async function createRecoveryAgent(data: {
    name: string;
    code: string;
    phone: string;
    email?: string;
    agencyName?: string;
}) {
    try {
        const [newAgent] = await db.insert(recoveryAgents).values({
            ...data,
            totalAssigned: 0,
            totalRecovered: 0,
            successRate: 0,
        }).returning(); // SQLite/Drizzle returning

        revalidatePath("/collections");
        return { success: true, data: newAgent };
    } catch (error) {
        console.error("Error creating recovery agent:", error);
        return { success: false, error: "Failed to create recovery agent" };
    }
}

export async function getDelinquentLoans() {
    try {
        // Fetch loans that are in DEFAULT or NPA status, or have overdue payments
        // For simplicity, we'll filter by status first
        const delinquentLoans = await db.query.loans.findMany({
            where: inArray(loans.status, ["DEFAULT", "NPA"]),
            with: {
                customer: true,
                product: true
            },
            orderBy: [desc(loans.totalOutstanding)],
        });

        return { success: true, data: delinquentLoans };
    } catch (error) {
        console.error("Error fetching delinquent loans:", error);
        return { success: false, error: "Failed to fetch delinquent loans" };
    }
}

export async function assignAgentToLoan(data: {
    agentId: string;
    loanId: string;
    assignedAmount: number;
    notes?: string;
}) {
    try {
        // Create assignment
        const [assignment] = await db.insert(recoveryAssignments).values({
            agentId: data.agentId,
            loanId: data.loanId,
            assignedAmount: data.assignedAmount,
            notes: data.notes,
            status: "ASSIGNED",
        }).returning();

        // Update agent stats (increment assigned count)
        // Note: Ideally this should be a transaction
        await db.update(recoveryAgents)
            .set({
                totalAssigned: sql`${recoveryAgents.totalAssigned} + 1`
            })
            .where(eq(recoveryAgents.id, data.agentId));

        revalidatePath("/collections");
        return { success: true, data: assignment };
    } catch (error) {
        console.error("Error assigning agent:", error);
        return { success: false, error: "Failed to assign agent" };
    }
}

export async function getRecoveryStats() {
    try {
        const agents = await db.select({ count: sql<number>`count(*)` }).from(recoveryAgents);
        const assignments = await db.select({
            totalAssigned: sql<number>`sum(${recoveryAssignments.assignedAmount})`,
            totalRecovered: sql<number>`sum(${recoveryAssignments.recoveredAmount})`
        }).from(recoveryAssignments);

        return {
            success: true,
            data: {
                totalAgents: agents[0]?.count || 0,
                totalAssignedAmount: assignments[0]?.totalAssigned || 0,
                totalRecoveredAmount: assignments[0]?.totalRecovered || 0,
            }
        }

    } catch (error) {
        return { success: false, error: "Failed to get stats" };
    }
}
