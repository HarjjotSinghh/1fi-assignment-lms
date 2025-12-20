import { db } from "@/db";
import { collaterals, customers, loans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateCSV, collateralExportColumns } from "@/lib/export";
import { logDataExport } from "@/lib/audit";

export async function GET() {
    try {
        const allCollaterals = await db
            .select({
                schemeName: collaterals.schemeName,
                amcName: collaterals.amcName,
                folioNumber: collaterals.folioNumber,
                schemeType: collaterals.schemeType,
                units: collaterals.units,
                purchaseNav: collaterals.purchaseNav,
                currentNav: collaterals.currentNav,
                purchaseValue: collaterals.purchaseValue,
                currentValue: collaterals.currentValue,
                pledgeStatus: collaterals.pledgeStatus,
                customerFirstName: customers.firstName,
                customerLastName: customers.lastName,
                loanNumber: loans.loanNumber,
            })
            .from(collaterals)
            .leftJoin(customers, eq(collaterals.customerId, customers.id))
            .leftJoin(loans, eq(collaterals.loanId, loans.id))
            .orderBy(desc(collaterals.createdAt));

        const csvContent = generateCSV(allCollaterals, collateralExportColumns as Parameters<typeof generateCSV>[1]);

        // Log the export for audit trail
        await logDataExport("COLLATERAL", "CSV", allCollaterals.length);

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="collateral-export-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export collateral:", error);
        return NextResponse.json({ error: "Failed to export collateral" }, { status: 500 });
    }
}
