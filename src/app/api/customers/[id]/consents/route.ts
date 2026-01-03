import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerConsents, customers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit, getClientInfo } from "@/lib/audit";

// GET /api/customers/[id]/consents
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "customers:view")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const consents = await db.query.customerConsents.findMany({
            where: eq(customerConsents.customerId, params.id),
            orderBy: [desc(customerConsents.grantedAt)],
        });

        return NextResponse.json(consents);
    } catch (error) {
        console.error("Fetch consents error:", error);
        return NextResponse.json({ error: "Failed to fetch consents" }, { status: 500 });
    }
}

// POST /api/customers/[id]/consents
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "customers:edit")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { consentType, granted, version } = body;
        const { ipAddress } = getClientInfo(request);

        const newConsent = await db.insert(customerConsents).values({
            customerId: params.id,
            consentType,
            granted,
            grantedAt: new Date().toISOString(),
            ipAddress,
            version: version || "1.0",
        }).returning();

        await logAudit({
            action: "UPDATE",
            entityType: "CUSTOMER",
            entityId: params.id,
            description: `Consent ${consentType} ${granted ? "GRANTED" : "REVOKED"}`,
            userId: session.user.id,
            metadata: { consentType, granted, version },
        });

        return NextResponse.json(newConsent[0]);

    } catch (error) {
        console.error("Update consent error:", error);
        return NextResponse.json({ error: "Failed to update consent" }, { status: 500 });
    }
}
