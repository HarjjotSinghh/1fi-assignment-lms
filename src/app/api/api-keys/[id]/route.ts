import { db } from "@/db";
import { apiKeys, auditLogs } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// DELETE - Revoke an API key
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can revoke API keys
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get the key first to verify it exists
        const [existingKey] = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.id, id));

        if (!existingKey) {
            return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }

        // Soft delete by setting isActive to false
        await db
            .update(apiKeys)
            .set({
                isActive: false,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(apiKeys.id, id));

        // Log the action
        await db.insert(auditLogs).values({
            action: "DELETE",
            entityType: "API_KEY",
            entityId: id,
            description: `Revoked API key: ${existingKey.name}`,
            userId: session.user.id,
        });

        return NextResponse.json({
            success: true,
            message: "API key revoked successfully",
        });
    } catch (error) {
        console.error("Error revoking API key:", error);
        return NextResponse.json(
            { error: "Failed to revoke API key" },
            { status: 500 }
        );
    }
}
