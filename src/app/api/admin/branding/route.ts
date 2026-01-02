import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBranding, updateBranding, type BrandingConfig } from "@/lib/branding";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/branding
 * Get branding configuration
 */
export async function GET() {
    try {
        const branding = await getBranding();
        return NextResponse.json(branding);
    } catch (error) {
        console.error("Get branding error:", error);
        return NextResponse.json(
            { error: "Failed to get branding" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/branding
 * Update branding configuration
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const branding = await updateBranding(body as Partial<BrandingConfig>, session.user.id);

        await logAudit({
            action: "UPDATE",
            entityType: "DOCUMENT",
            description: "Branding settings updated",
            metadata: body,
            userId: session.user.id,
        });

        return NextResponse.json(branding);
    } catch (error) {
        console.error("Update branding error:", error);
        return NextResponse.json(
            { error: "Failed to update branding" },
            { status: 500 }
        );
    }
}
