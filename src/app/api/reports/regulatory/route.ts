import { NextRequest, NextResponse } from "next/server";
import { generateRegulatoryReport } from "@/lib/regulatory-reports";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (!type) {
            return NextResponse.json({ error: "Report type required" }, { status: 400 });
        }

        const validTypes = ["NPA", "SECTOR_EXPOSURE", "ALM", "PRUDENTIAL_NORMS"];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        }

        const result = await generateRegulatoryReport(type);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Regulatory report generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate report" }, 
            { status: 500 }
        );
    }
}
