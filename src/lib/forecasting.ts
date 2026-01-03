/**
 * Enhanced Cash Flow Forecasting Library (Phase 3)
 * Predicts future cash flows based on EMI schedules, collection efficiency, and seasonality
 */

import { db } from "@/db";
import { emiSchedule, payments, loans } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

export interface CashFlowForecast {
    month: string; // YYYY-MM
    monthName: string; // Jan 2024
    expectedCollection: number; // Scheduled EMIs
    projectedCollection: number; // Risk-adjusted projection
    previousTrend: number; // Historical collection efficiency %
    loanCount: number;
    avgTicketSize: number;
}

export interface ForecastSummary {
    forecast: CashFlowForecast[];
    efficiency: number;
    totalExpected: number;
    totalProjected: number;
    riskAdjustedShortfall: number;
}

/**
 * Calculate historical collection efficiency from actual payment data
 */
async function calculateHistoricalEfficiency(): Promise<number> {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Get total EMIs due in past 6 months
        const dueEmis = await db.query.emiSchedule.findMany({
            where: and(
                lt(emiSchedule.dueDate, new Date().toISOString().split('T')[0]),
                gte(emiSchedule.dueDate, sixMonthsAgo.toISOString().split('T')[0])
            ),
        });

        const totalDue = dueEmis.reduce((acc, emi) => acc + (emi.emiAmount || 0), 0);
        const totalPaid = dueEmis
            .filter(emi => emi.status === "PAID")
            .reduce((acc, emi) => acc + (emi.emiAmount || 0), 0);

        return totalDue > 0 ? totalPaid / totalDue : 0.95; // Default 95% if no data
    } catch (error) {
        console.error("Efficiency calculation error:", error);
        return 0.95; // Fallback
    }
}

/**
 * Apply seasonality adjustments based on month
 * NBFCs typically see lower collections in festival months
 */
function getSeasonalityFactor(month: number): number {
    // Indian calendar considerations
    const seasonalFactors: Record<number, number> = {
        0: 0.98,  // January - Post holidays
        1: 1.00,  // February
        2: 1.02,  // March - Year end
        3: 0.97,  // April - New year start
        4: 1.00,  // May
        5: 1.00,  // June
        6: 0.95,  // July - Monsoon
        7: 0.93,  // August - Monsoon
        8: 0.92,  // September - Festival season starts
        9: 0.88,  // October - Diwali month
        10: 0.95, // November - Post Diwali
        11: 0.98, // December - Year end
    };
    return seasonalFactors[month] || 1.0;
}

/**
 * Generate 6-month cash flow forecast with live data
 */
export async function generateCashFlowForecast(): Promise<ForecastSummary> {
    const today = new Date();
    const historicalEfficiency = await calculateHistoricalEfficiency();

    const forecast: CashFlowForecast[] = [];
    let totalExpected = 0;
    let totalProjected = 0;

    for (let i = 0; i < 6; i++) {
        const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);

        const monthKey = targetDate.toISOString().slice(0, 7);
        const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Fetch EMIs due in this month
        const monthEmis = await db.query.emiSchedule.findMany({
            where: and(
                gte(emiSchedule.dueDate, targetDate.toISOString().split('T')[0]),
                lt(emiSchedule.dueDate, nextMonth.toISOString().split('T')[0]),
                eq(emiSchedule.status, "PENDING")
            ),
        });

        const expectedAmount = monthEmis.reduce((acc, emi) => acc + (emi.emiAmount || 0), 0);
        const seasonalFactor = getSeasonalityFactor(targetDate.getMonth());
        const projectedAmount = expectedAmount * historicalEfficiency * seasonalFactor;

        const uniqueLoans = new Set(monthEmis.map(e => e.loanId)).size;
        const avgTicket = uniqueLoans > 0 ? expectedAmount / uniqueLoans : 0;

        forecast.push({
            month: monthKey,
            monthName,
            expectedCollection: Math.round(expectedAmount),
            projectedCollection: Math.round(projectedAmount),
            previousTrend: Math.round(historicalEfficiency * 100 * 10) / 10,
            loanCount: uniqueLoans,
            avgTicketSize: Math.round(avgTicket),
        });

        totalExpected += expectedAmount;
        totalProjected += projectedAmount;
    }

    return {
        forecast,
        efficiency: historicalEfficiency,
        totalExpected: Math.round(totalExpected),
        totalProjected: Math.round(totalProjected),
        riskAdjustedShortfall: Math.round(totalExpected - totalProjected),
    };
}

/**
 * Simple forecast for API use (without DB calls) - for testing
 */
export function generateSimpleForecast(
    schedules: Array<{ dueDate: string; amount: number }>,
    historicalEfficiency = 0.95
): CashFlowForecast[] {
    const today = new Date();
    const buckets: Record<string, { total: number; count: number }> = {};

    // Initialize next 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const key = d.toISOString().slice(0, 7);
        buckets[key] = { total: 0, count: 0 };
    }

    // Aggregate scheduled amounts
    schedules.forEach((sch) => {
        const key = sch.dueDate.slice(0, 7);
        if (buckets[key]) {
            buckets[key].total += sch.amount;
            buckets[key].count++;
        }
    });

    return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => {
            const date = new Date(month + "-01");
            return {
                month,
                monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                expectedCollection: data.total,
                projectedCollection: Math.round(data.total * historicalEfficiency),
                previousTrend: historicalEfficiency * 100,
                loanCount: data.count,
                avgTicketSize: data.count > 0 ? Math.round(data.total / data.count) : 0,
            };
        });
}
