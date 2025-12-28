import { db } from "@/db";
import { loans, collaterals, loanProducts, marginCalls, auditLogs, notifications } from "@/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // 1. Get active loans
        const activeLoans = await db
            .select({
                id: loans.id,
                loanNumber: loans.loanNumber,
                outstandingPrincipal: loans.outstandingPrincipal,
                totalOutstanding: loans.totalOutstanding,
                customerId: loans.customerId,
                productId: loans.productId,
                marginCallThreshold: loanProducts.marginCallThreshold,
                liquidationThreshold: loanProducts.liquidationThreshold,
            })
            .from(loans)
            .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
            .where(eq(loans.status, "ACTIVE"));

        let loansChecked = 0;
        let marginCallsGenerated = 0;

        for (const loan of activeLoans) {
            loansChecked++;

            // 2. Get total collateral value for this loan
            const collateralResult = await db
                .select({
                    totalValue: sum(collaterals.currentValue),
                })
                .from(collaterals)
                .where(
                    and(
                        eq(collaterals.loanId, loan.id),
                        eq(collaterals.pledgeStatus, "PLEDGED")
                    )
                );

            const totalCollateralValue = Number(collateralResult[0]?.totalValue || 0);

            if (totalCollateralValue === 0) continue;

            // 3. Calculate LTV
            // LTV = (Outstanding Amount / Collateral Value) * 100
            const currentLtv = (loan.totalOutstanding / totalCollateralValue) * 100;

            // Update Loan LTV
            await db.update(loans).set({ currentLtv }).where(eq(loans.id, loan.id));

            // 4. Check for Margin Call Breach
            if (loan.marginCallThreshold && currentLtv >= loan.marginCallThreshold) {
                // Check if pending margin call already exists
                const existingCall = await db
                    .select()
                    .from(marginCalls)
                    .where(
                        and(
                            eq(marginCalls.loanId, loan.id),
                            eq(marginCalls.status, "PENDING")
                        )
                    );

                if (existingCall.length === 0) {
                    // Create Margin Call
                    // Shortfall = (LTV - Threshold) * Collateral / 100 ?? Or just amount to bring LTV back to safe limits?
                    // Simplification: Shortfall is amount needed to reduce Loan to hit Threshold LTV
                    // Target Loan = Threshold * Collateral / 100
                    // Shortfall = Current Loan - Target Loan
                    const maxSafeLoanAmount = (loan.marginCallThreshold * totalCollateralValue) / 100;
                    const shortfallAmount = loan.totalOutstanding - maxSafeLoanAmount;

                    const activeCall = await db.insert(marginCalls).values({
                        loanId: loan.id,
                        customerId: loan.customerId,
                        triggerLtv: loan.marginCallThreshold,
                        currentLtv: currentLtv,
                        shortfallAmount: Math.max(0, shortfallAmount),
                        status: "PENDING",
                        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    }).returning();

                    // Create Notification
                    await db.insert(notifications).values({
                        userId: loan.customerId, // Assuming customer links to user ID for demo, usually stricter separation
                        type: "ALERT",
                        title: "Margin Call Alert",
                        message: `Loan ${loan.loanNumber} LTV has breached ${loan.marginCallThreshold}%. Please add collateral.`,
                        entityType: "LOAN",
                        entityId: loan.id,
                        link: `/loans/${loan.id}`,
                    });

                    marginCallsGenerated++;
                }
            }
        }

        // Audit log
        await db.insert(auditLogs).values({
            action: "UPDATE",
            entityType: "LOAN",
            description: `Daily Margin Call Check: Checked ${loansChecked} loans, Generated ${marginCallsGenerated} margin calls`,
            // userId: null // System action
        });

        return NextResponse.json({
            success: true,
            message: "Margin call check completed",
            data: {
                loansChecked,
                marginCallsGenerated,
            },
        });
    } catch (error) {
        console.error("Error in Margin Call job:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process margin calls" },
            { status: 500 }
        );
    }
}
