import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loginHistory, users } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

/**
 * GET /api/admin/login-history
 * List login history with filtering
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || !hasPermission(session.user.role, "dashboard:full_stats")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const success = searchParams.get("success");
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const limit = parseInt(searchParams.get("limit") || "100", 10);

        let query = db.select().from(loginHistory);

        const conditions = [];

        if (userId) {
            conditions.push(eq(loginHistory.userId, userId));
        }

        if (success !== null && success !== "") {
            conditions.push(eq(loginHistory.success, success === "true"));
        }

        if (from) {
            conditions.push(gte(loginHistory.createdAt, from));
        }

        if (to) {
            conditions.push(lte(loginHistory.createdAt, to));
        }

        const history = await db.query.loginHistory.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(loginHistory.createdAt)],
            limit,
        });

        // Get user details for each entry
        const enriched = await Promise.all(
            history.map(async (entry) => {
                let user = null;
                if (entry.userId) {
                    user = await db.query.users.findFirst({
                        where: eq(users.id, entry.userId),
                        columns: { id: true, name: true, email: true },
                    });
                }
                return { ...entry, user };
            })
        );

        // Get summary statistics
        const stats = {
            totalLogins: history.length,
            successfulLogins: history.filter((h) => h.success).length,
            failedLogins: history.filter((h) => !h.success).length,
            uniqueUsers: new Set(history.map((h) => h.userId)).size,
        };

        return NextResponse.json({
            history: enriched,
            stats,
        });
    } catch (error) {
        console.error("List login history error:", error);
        return NextResponse.json(
            { error: "Failed to list login history" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/login-history
 * Record a login attempt (internal use)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, success, ipAddress, userAgent, location, failureReason, mfaUsed, sessionId } = body;

        const [entry] = await db
            .insert(loginHistory)
            .values({
                userId,
                success,
                ipAddress,
                userAgent,
                location,
                failureReason,
                mfaUsed: mfaUsed || false,
                sessionId,
            })
            .returning();

        return NextResponse.json(entry);
    } catch (error) {
        console.error("Record login history error:", error);
        return NextResponse.json(
            { error: "Failed to record login" },
            { status: 500 }
        );
    }
}
