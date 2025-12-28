import { db } from "@/db";
import { webhooks, auditLogs } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateWebhookSecret } from "@/lib/webhook";
import { z } from "zod";

const webhookSchema = z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Invalid URL"),
    events: z.array(z.string()).min(1, "Select at least one event"),
});

// GET - List all webhooks
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allWebhooks = await db
            .select()
            .from(webhooks)
            .orderBy(webhooks.createdAt);

        return NextResponse.json({ webhooks: allWebhooks });
    } catch (error) {
        console.error("Error fetching webhooks:", error);
        return NextResponse.json(
            { error: "Failed to fetch webhooks" },
            { status: 500 }
        );
    }
}

// POST - Create a new webhook
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const result = webhookSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid request", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { name, url, events } = result.data;
        const secret = generateWebhookSecret();

        // Insert into database
        const [newWebhook] = await db
            .insert(webhooks)
            .values({
                name,
                url,
                secret,
                events: JSON.stringify(events),
                isActive: true, // Default to true using 1/0 for sqlite boolean mode handled by drizzle
                createdById: session.user.id,
            })
            .returning();

        // Log the action
        await db.insert(auditLogs).values({
            action: "CREATE",
            entityType: "WEBHOOK",
            entityId: newWebhook.id,
            description: `Created webhook: ${name}`,
            userId: session.user.id,
        });

        return NextResponse.json({
            success: true,
            webhook: newWebhook,
            message: "Webhook created successfully",
        });
    } catch (error) {
        console.error("Error creating webhook:", error);
        return NextResponse.json(
            { error: "Failed to create webhook" },
            { status: 500 }
        );
    }
}
