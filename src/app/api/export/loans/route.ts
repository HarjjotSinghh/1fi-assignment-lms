import { db } from "@/db";
import { loans, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateCSV, loansExportColumns } from "@/lib/export";
import { logDataExport } from "@/lib/audit";

export async function GET() {
    try {
        const allLoans = await db
            .select({
                loanNumber: loans.loanNumber,
                principalAmount: loans.principalAmount,
                interestRate: loans.interestRate,
                tenure: loans.tenure,
                emiAmount: loans.emiAmount,
                outstandingPrincipal: loans.outstandingPrincipal,
                totalOutstanding: loans.totalOutstanding,
                disbursedAt: loans.disbursedAt,
                maturityDate: loans.maturityDate,
                status: loans.status,
                currentLtv: loans.currentLtv,
                customerFirstName: customers.firstName,
                customerLastName: customers.lastName,
                customerEmail: customers.email,
                productName: loanProducts.name,
            })
            .from(loans)
            .leftJoin(customers, eq(loans.customerId, customers.id))
            .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
            .orderBy(desc(loans.createdAt));

        const csvContent = generateCSV(allLoans, loansExportColumns as Parameters<typeof generateCSV>[1]);

        // Log the export for audit trail
        await logDataExport("LOAN", "CSV", allLoans.length);

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="loans-export-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export loans:", error);
        return NextResponse.json({ error: "Failed to export loans" }, { status: 500 });
    }
}
