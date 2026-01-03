import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { communicationTemplates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// GET /api/admin/templates
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        // Permission check
        if (!session?.user?.id || !hasPermission(session.user.role, "system:manage")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const templates = await db.query.communicationTemplates.findMany({
            orderBy: [desc(communicationTemplates.createdAt)],
        });

        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

// POST /api/admin/templates
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "system:manage")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name, channel, subject, body: content, variables } = body;

        const newTemplate = await db.insert(communicationTemplates).values({
            name,
            channel,
            subject,
            body: content,
            variables: JSON.stringify(variables),
            isActive: true,
        }).returning();

        await logAudit({
            action: "CREATE",
            entityType: "DOCUMENT", // Closest fit
            entityId: newTemplate[0].id,
            description: `Created template ${name} (${channel})`,
            userId: session.user.id,
        });

        return NextResponse.json(newTemplate[0]);

    } catch (error) {
        console.error("Create template error:", error);
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
}
