import { NextResponse } from "next/server";
import { detectRebalancingNeeds } from "@/lib/rebalancing";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await detectRebalancingNeeds();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Rebalancing detection error:", error);
        return NextResponse.json(
            { 
                error: "Failed to detect rebalancing needs",
                needsRebalancing: [],
                totalLoansChecked: 0,
                loansAtRisk: 0,
                totalShortfall: 0,
            }, 
            { status: 500 }
        );
    }
}
