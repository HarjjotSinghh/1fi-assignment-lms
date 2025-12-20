import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const entityType = searchParams.get("entityType");
        const action = searchParams.get("action");

        const offset = (page - 1) * limit;

        // Build the query
        let query = db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                description: auditLogs.description,
                metadata: auditLogs.metadata,
                ipAddress: auditLogs.ipAddress,
                createdAt: auditLogs.createdAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset);

        // Apply filters
        const conditions = [];
        if (entityType) {
            conditions.push(eq(auditLogs.entityType, entityType));
        }
        if (action) {
            conditions.push(eq(auditLogs.action, action));
        }

        const logs = await query;

        // Get total count for pagination
        const [{ count: totalCount }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(auditLogs);

        return NextResponse.json({
            data: logs,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
}
