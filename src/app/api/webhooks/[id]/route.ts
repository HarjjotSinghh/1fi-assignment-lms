import { db } from "@/db";
import { webhooks, auditLogs } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// PUT - Update a webhook entirely
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();

        // Validate required fields for PUT (full update)
        if (!body.name || !body.url || !body.events) {
            return NextResponse.json(
                { error: "Missing required fields: name, url, events" },
                { status: 400 }
            );
        }

        // Check if webhook exists
        const [existingWebhook] = await db
            .select()
            .from(webhooks)
            .where(eq(webhooks.id, id));

        if (!existingWebhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        // Update the webhook
        const [updatedWebhook] = await db
            .update(webhooks)
            .set({
                name: body.name,
                url: body.url,
                events: body.events,
                secret: body.secret || null,
                isActive: body.isActive ?? true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(webhooks.id, id))
            .returning();

        // Log the action
        await db.insert(auditLogs).values({
            action: "UPDATE",
            entityType: "WEBHOOK",
            entityId: id,
            description: `Updated webhook (PUT): ${updatedWebhook.name}`,
            userId: session.user.id,
        });

        return NextResponse.json(updatedWebhook);
    } catch (error) {
        console.error("Error updating webhook:", error);
        return NextResponse.json(
            { error: "Failed to update webhook" },
            { status: 500 }
        );
    }
}

// PATCH - Partially update a webhook
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();

        // Check if webhook exists
        const [existingWebhook] = await db
            .select()
            .from(webhooks)
            .where(eq(webhooks.id, id));

        if (!existingWebhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        // Update the webhook with provided fields
        const [updatedWebhook] = await db
            .update(webhooks)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(webhooks.id, id))
            .returning();

        // Log the action
        await db.insert(auditLogs).values({
            action: "UPDATE",
            entityType: "WEBHOOK",
            entityId: id,
            description: `Updated webhook (PATCH): ${updatedWebhook.name}`,
            userId: session.user.id,
        });

        return NextResponse.json(updatedWebhook);
    } catch (error) {
        console.error("Error updating webhook:", error);
        return NextResponse.json(
            { error: "Failed to update webhook" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a webhook
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get the webhook first
        const [existingWebhook] = await db
            .select()
            .from(webhooks)
            .where(eq(webhooks.id, id));

        if (!existingWebhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        // Delete the webhook
        await db.delete(webhooks).where(eq(webhooks.id, id));

        // Log the action
        await db.insert(auditLogs).values({
            action: "DELETE",
            entityType: "WEBHOOK",
            entityId: id,
            description: `Deleted webhook: ${existingWebhook.name}`,
            userId: session.user.id,
        });

        return NextResponse.json({
            success: true,
            message: "Webhook deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting webhook:", error);
        return NextResponse.json(
            { error: "Failed to delete webhook" },
            { status: 500 }
        );
    }
}
