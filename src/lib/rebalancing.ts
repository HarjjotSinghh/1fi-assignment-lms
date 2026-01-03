/**
 * Portfolio Rebalancing Library (Phase 6)
 * Automated detection and suggestions for collateral rebalancing
 */

import { db } from "@/db";
import { loans, collaterals, marginCalls, loanProducts } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";

export interface RebalancingNeed {
    loanId: string;
    customerId: string;
    customerName: string;
    currentLtv: number;
    targetLtv: number;
    collateralValue: number;
    outstandingAmount: number;
    shortfall: number;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    suggestedActions: RebalancingAction[];
}

export interface RebalancingAction {
    type: "TOP_UP" | "SWITCH" | "PARTIAL_REPAY";
    description: string;
    amount: number;
    impact: string;
}

export interface RebalancingResult {
    needsRebalancing: RebalancingNeed[];
    totalLoansChecked: number;
    loansAtRisk: number;
    totalShortfall: number;
}

/**
 * Detect all loans needing rebalancing based on LTV thresholds
 */
export async function detectRebalancingNeeds(): Promise<RebalancingResult> {
    try {
        // Get all active loans with their products and customers
        const activeLoans = await db.query.loans.findMany({
            where: eq(loans.status, "ACTIVE"),
            with: {
                product: true,
                customer: true,
            },
        });

        const needsRebalancing: RebalancingNeed[] = [];
        let totalShortfall = 0;

        for (const loan of activeLoans) {
            const currentLtv = loan.currentLtv || 0;
            const marginCallThreshold = loan.product?.marginCallThreshold || 80;
            const liquidationThreshold = loan.product?.liquidationThreshold || 90;
            const maxLtv = loan.product?.maxLtvPercent || 75;

            // Check if LTV exceeds thresholds
            if (currentLtv > maxLtv) {
                // Get collateral value for this loan
                const loanCollaterals = await db.query.collaterals.findMany({
                    where: eq(collaterals.loanId, loan.id),
                });

                const collateralValue = loanCollaterals.reduce(
                    (sum, c) => sum + (c.currentValue || 0),
                    0
                );

                const outstandingAmount = loan.outstandingPrincipal + loan.outstandingInterest;
                const targetCollatValue = outstandingAmount / (maxLtv / 100);
                const shortfall = targetCollatValue - collateralValue;

                // Determine urgency
                let urgency: RebalancingNeed["urgency"];
                if (currentLtv >= liquidationThreshold) {
                    urgency = "CRITICAL";
                } else if (currentLtv >= marginCallThreshold) {
                    urgency = "HIGH";
                } else if (currentLtv >= maxLtv + 5) {
                    urgency = "MEDIUM";
                } else {
                    urgency = "LOW";
                }

                // Generate suggested actions
                const suggestedActions: RebalancingAction[] = [];

                // Top-up: Add more collateral
                if (shortfall > 0) {
                    suggestedActions.push({
                        type: "TOP_UP",
                        description: `Add additional collateral worth ₹${Math.round(shortfall).toLocaleString("en-IN")}`,
                        amount: shortfall,
                        impact: `Reduces LTV to target ${maxLtv}%`,
                    });
                }

                // Partial repayment option
                const repaymentForTarget = outstandingAmount - (collateralValue * maxLtv / 100);
                if (repaymentForTarget > 0) {
                    suggestedActions.push({
                        type: "PARTIAL_REPAY",
                        description: `Partial prepayment of ₹${Math.round(repaymentForTarget).toLocaleString("en-IN")}`,
                        amount: repaymentForTarget,
                        impact: `Reduces LTV to target ${maxLtv}%`,
                    });
                }

                // Switch to lower risk funds
                if (collateralValue > 0) {
                    suggestedActions.push({
                        type: "SWITCH",
                        description: "Switch to lower-risk debt funds with higher LTV allowance",
                        amount: 0,
                        impact: "May increase eligible collateral value",
                    });
                }

                needsRebalancing.push({
                    loanId: loan.id,
                    customerId: loan.customerId,
                    customerName: `${loan.customer?.firstName || ''} ${loan.customer?.lastName || ''}`.trim() || "Unknown",
                    currentLtv,
                    targetLtv: maxLtv,
                    collateralValue,
                    outstandingAmount,
                    shortfall: Math.max(0, shortfall),
                    urgency,
                    suggestedActions,
                });

                totalShortfall += Math.max(0, shortfall);
            }
        }

        // Sort by urgency
        const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        needsRebalancing.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

        return {
            needsRebalancing,
            totalLoansChecked: activeLoans.length,
            loansAtRisk: needsRebalancing.length,
            totalShortfall,
        };
    } catch (error) {
        console.error("Rebalancing detection error:", error);
        throw error;
    }
}

/**
 * Get rebalancing history for a specific loan
 */
export async function getRebalancingHistory(loanId: string) {
    const history = await db.query.marginCalls.findMany({
        where: eq(marginCalls.loanId, loanId),
        orderBy: (marginCalls, { desc }) => [desc(marginCalls.createdAt)],
    });

    return history.map((mc) => ({
        date: mc.createdAt,
        triggerLtv: mc.triggerLtv,
        shortfall: mc.shortfallAmount,
        status: mc.status,
        resolvedAt: mc.resolvedAt,
        topUpAmount: mc.topUpAmount,
    }));
}

/**
 * Calculate optimal rebalancing for a portfolio
 */
export function calculateOptimalRebalancing(
    collaterals: Array<{ value: number; schemeType: string; ltvAllowance: number }>,
    targetLtv: number,
    outstandingAmount: number
): { reallocation: any[]; expectedLtv: number } {
    // Sort by LTV allowance (prefer higher LTV schemes)
    const sorted = [...collaterals].sort((a, b) => b.ltvAllowance - a.ltvAllowance);

    let remainingLoan = outstandingAmount;
    const reallocation: any[] = [];

    for (const collat of sorted) {
        const maxLoanOnThis = collat.value * (collat.ltvAllowance / 100);
        const allocated = Math.min(remainingLoan, maxLoanOnThis);

        reallocation.push({
            schemeType: collat.schemeType,
            value: collat.value,
            allocatedLoan: allocated,
            utilization: (allocated / collat.value) * 100,
        });

        remainingLoan -= allocated;
        if (remainingLoan <= 0) break;
    }

    const totalValue = collaterals.reduce((sum, c) => sum + c.value, 0);
    const expectedLtv = totalValue > 0 ? (outstandingAmount / totalValue) * 100 : 0;

    return { reallocation, expectedLtv };
}
