"use server";

import { db } from "@/db";
import { loanApplications, customers, loanProducts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getApplicationsForExportAction() {
    try {
        const data = await db
            .select({
                applicationNo: loanApplications.applicationNumber,
                id: loanApplications.id,
                customer: customers.firstName, // Simplified for brevity
                customerEmail: customers.email,
                requestedAmount: loanApplications.requestedAmount,
                tenure: loanApplications.tenure,
                status: loanApplications.status,
                product: loanProducts.name,
                submittedAt: loanApplications.submittedAt,
            })
            .from(loanApplications)
            .leftJoin(customers, eq(loanApplications.customerId, customers.id))
            .leftJoin(loanProducts, eq(loanApplications.productId, loanProducts.id))
            .orderBy(desc(loanApplications.createdAt));

        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch applications for export:", error);
        return { success: false, error: "Failed to fetch data" };
    }
}
