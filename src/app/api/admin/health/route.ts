import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { performHealthCheck, formatUptime } from "@/lib/health";

/**
 * GET /api/admin/health
 * Get system health status
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id || !hasPermission(session.user.role, "dashboard:view")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const health = await performHealthCheck();

        return NextResponse.json({
            ...health,
            uptimeFormatted: formatUptime(health.uptime),
        });
    } catch (error) {
        console.error("Health check error:", error);
        return NextResponse.json(
            {
                overall: "CRITICAL",
                uptime: 0,
                uptimeFormatted: "0s",
                metrics: [
                    {
                        metric: "HEALTH_CHECK",
                        value: -1,
                        status: "CRITICAL",
                        message: "Health check failed",
                        timestamp: new Date(),
                    },
                ],
                lastCheck: new Date(),
            },
            { status: 500 }
        );
    }
}
