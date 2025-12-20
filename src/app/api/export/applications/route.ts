import { db } from "@/db";
import { loanApplications, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateCSV, applicationsExportColumns } from "@/lib/export";
import { logDataExport } from "@/lib/audit";

export async function GET() {
    try {
        const applications = await db
            .select({
                applicationNumber: loanApplications.applicationNumber,
                requestedAmount: loanApplications.requestedAmount,
                approvedAmount: loanApplications.approvedAmount,
                tenure: loanApplications.tenure,
                status: loanApplications.status,
                source: loanApplications.source,
                createdAt: loanApplications.createdAt,
                customerFirstName: customers.firstName,
                customerLastName: customers.lastName,
                customerEmail: customers.email,
                productName: loanProducts.name,
            })
            .from(loanApplications)
            .leftJoin(customers, eq(loanApplications.customerId, customers.id))
            .leftJoin(loanProducts, eq(loanApplications.productId, loanProducts.id))
            .orderBy(desc(loanApplications.createdAt));

        const csvContent = generateCSV(applications, applicationsExportColumns as Parameters<typeof generateCSV>[1]);

        // Log the export for audit trail
        await logDataExport("APPLICATION", "CSV", applications.length);

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="applications-export-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export applications:", error);
        return NextResponse.json({ error: "Failed to export applications" }, { status: 500 });
    }
}
