import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCashFlowForecast } from "@/lib/forecasting";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "analytics:view")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // Use the enhanced forecasting function that queries live data
        const forecastSummary = await generateCashFlowForecast();

        return NextResponse.json({
            forecast: forecastSummary.forecast,
            efficiency: forecastSummary.efficiency,
            totalExpected: forecastSummary.totalExpected,
            totalProjected: forecastSummary.totalProjected,
            shortfall: forecastSummary.riskAdjustedShortfall,
        });
    } catch (error) {
        console.error("Cash flow forecast error:", error);
        return NextResponse.json(
            { error: "Failed to generate forecast" },
            { status: 500 }
        );
    }
}
