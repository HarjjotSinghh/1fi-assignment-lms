import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customFieldDefinitions, customFieldValues } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// GET /api/admin/custom-fields
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "system:manage")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const entity = searchParams.get("entity");

        let fields;
        if (entity) {
            fields = await db.query.customFieldDefinitions.findMany({
                where: and(
                    eq(customFieldDefinitions.entity, entity),
                    eq(customFieldDefinitions.isActive, true)
                ),
                orderBy: [customFieldDefinitions.displayOrder],
            });
        } else {
            fields = await db.query.customFieldDefinitions.findMany({
                orderBy: [desc(customFieldDefinitions.createdAt)],
            });
        }

        return NextResponse.json(fields);
    } catch (error) {
        console.error("Fetch custom fields error:", error);
        return NextResponse.json({ error: "Failed to fetch custom fields" }, { status: 500 });
    }
}

// POST /api/admin/custom-fields
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "system:manage")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { entity, fieldName, fieldLabel, fieldType, options, placeholder, helpText, isRequired, validationRegex } = body;

        const newField = await db.insert(customFieldDefinitions).values({
            entity,
            fieldName: fieldName.toLowerCase().replace(/\s+/g, '_'),
            fieldLabel,
            fieldType,
            options: options ? JSON.stringify(options) : null,
            placeholder,
            helpText,
            isRequired: isRequired || false,
            validationRegex,
            isActive: true,
            displayOrder: 0,
        }).returning();

        await logAudit({
            action: "CREATE",
            entityType: "DOCUMENT",
            entityId: newField[0].id,
            description: `Created custom field: ${fieldLabel} for ${entity}`,
            userId: session.user.id,
        });

        return NextResponse.json(newField[0]);
    } catch (error) {
        console.error("Create custom field error:", error);
        return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
    }
}

// DELETE /api/admin/custom-fields
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "system:manage")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Field ID required" }, { status: 400 });
        }

        // Soft delete - just mark as inactive
        await db.update(customFieldDefinitions)
            .set({ isActive: false })
            .where(eq(customFieldDefinitions.id, id));

        await logAudit({
            action: "DELETE",
            entityType: "DOCUMENT",
            entityId: id,
            description: `Deactivated custom field`,
            userId: session.user.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete custom field error:", error);
        return NextResponse.json({ error: "Failed to delete custom field" }, { status: 500 });
    }
}
