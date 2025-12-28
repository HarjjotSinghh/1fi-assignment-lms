import { db } from "@/db";
import { apiKeys, auditLogs } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

// Generate a secure API key
function generateApiKey(): string {
    const prefix = "fiq_live_";
    const randomPart = randomBytes(32).toString("hex");
    return prefix + randomPart;
}

// GET - List all API keys (for current user or all for admin)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const keys = await db
            .select()
            .from(apiKeys)
            .orderBy(apiKeys.createdAt);

        return NextResponse.json({ keys });
    } catch (error) {
        console.error("Error fetching API keys:", error);
        return NextResponse.json(
            { error: "Failed to fetch API keys" },
            { status: 500 }
        );
    }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can create API keys
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Generate a new API key
        const key = generateApiKey();

        // Insert into database
        const [newKey] = await db
            .insert(apiKeys)
            .values({
                key,
                name: name.trim(),
                description: description?.trim() || null,
                userId: session.user.id,
                isActive: true,
            })
            .returning();

        // Log the action
        await db.insert(auditLogs).values({
            action: "CREATE",
            entityType: "API_KEY",
            entityId: newKey.id,
            description: `Created API key: ${name}`,
            userId: session.user.id,
        });

        return NextResponse.json({
            success: true,
            id: newKey.id,
            key, // Return the full key only on creation
            name: newKey.name,
            message: "API key created successfully",
        });
    } catch (error) {
        console.error("Error creating API key:", error);
        return NextResponse.json(
            { error: "Failed to create API key" },
            { status: 500 }
        );
    }
}
