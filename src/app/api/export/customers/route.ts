import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateCSV, customersExportColumns } from "@/lib/export";
import { logDataExport } from "@/lib/audit";

export async function GET() {
    try {
        const allCustomers = await db
            .select()
            .from(customers)
            .orderBy(desc(customers.createdAt));

        const csvContent = generateCSV(allCustomers, customersExportColumns as Parameters<typeof generateCSV>[1]);

        // Log the export for audit trail
        await logDataExport("CUSTOMER", "CSV", allCustomers.length);

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="customers-export-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export customers:", error);
        return NextResponse.json({ error: "Failed to export customers" }, { status: 500 });
    }
}
