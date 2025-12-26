"use server";

import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getAuditLogsAction(limit = 50) {
    try {
        const logs = await db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                description: auditLogs.description,
                createdAt: auditLogs.createdAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);

        return { success: true, data: logs };
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return { success: false, error: "Failed to fetch audit logs" };
    }
}
