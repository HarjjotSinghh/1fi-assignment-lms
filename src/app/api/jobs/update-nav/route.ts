import { db } from "@/db";
import { collaterals, auditLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // 1. Get all pledged collaterals
        const pledgedCollaterals = await db
            .select()
            .from(collaterals)
            .where(eq(collaterals.pledgeStatus, "PLEDGED"));

        let updatedCount = 0;
        const updates = pledgedCollaterals.map(async (collateral) => {
            // Simulate market fluctuation: -2.0% to +2.0%
            const fluctuationPercent = (Math.random() * 4 - 2) / 100;
            const newNav = Number(collateral.currentNav) * (1 + fluctuationPercent);
            const newValue = Number(collateral.units) * newNav;

            await db
                .update(collaterals)
                .set({
                    currentNav: newNav,
                    currentValue: newValue,
                    lastValuationAt: new Date().toISOString(),
                })
                .where(eq(collaterals.id, collateral.id));

            updatedCount++;
        });

        await Promise.all(updates);

        // Audit log
        await db.insert(auditLogs).values({
            action: "UPDATE",
            entityType: "COLLATERAL",
            description: `Daily NAV Update Batch: Updated ${updatedCount} collateral records`,
        });

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} collateral records`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error in NAV update job:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update NAVs" },
            { status: 500 }
        );
    }
}
