/**
 * System Health Monitoring Utilities
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";

export interface HealthMetric {
    metric: string;
    value: number;
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    message: string;
    timestamp: Date;
}

export interface SystemHealth {
    overall: "HEALTHY" | "WARNING" | "CRITICAL";
    uptime: number;
    metrics: HealthMetric[];
    lastCheck: Date;
}

const startTime = Date.now();

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<HealthMetric> {
    const start = Date.now();
    let status: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
    let message = "Database is responsive";

    try {
        await db.all(sql`SELECT 1`);
        const latency = Date.now() - start;

        if (latency > 1000) {
            status = "CRITICAL";
            message = `Database latency is critical: ${latency}ms`;
        } else if (latency > 500) {
            status = "WARNING";
            message = `Database latency is high: ${latency}ms`;
        } else {
            message = `Database latency: ${latency}ms`;
        }

        return {
            metric: "DATABASE_LATENCY",
            value: latency,
            status,
            message,
            timestamp: new Date(),
        };
    } catch (error) {
        return {
            metric: "DATABASE_LATENCY",
            value: -1,
            status: "CRITICAL",
            message: `Database error: ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: new Date(),
        };
    }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthMetric {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((used.heapUsed / used.heapTotal) * 100);

    let status: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
    let message = `Heap usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`;

    if (usagePercent > 90) {
        status = "CRITICAL";
        message = `Memory usage critical: ${usagePercent}%`;
    } else if (usagePercent > 75) {
        status = "WARNING";
        message = `Memory usage high: ${usagePercent}%`;
    }

    return {
        metric: "MEMORY_USAGE",
        value: usagePercent,
        status,
        message,
        timestamp: new Date(),
    };
}

/**
 * Check external service (Cashfree)
 */
async function checkExternalServices(): Promise<HealthMetric[]> {
    const metrics: HealthMetric[] = [];

    // Check Cashfree API (if configured)
    if (process.env.CASHFREE_CLIENT_ID) {
        try {
            const start = Date.now();
            const response = await fetch("https://api.cashfree.com/pg/v1/health", {
                method: "GET",
                signal: AbortSignal.timeout(5000),
            });
            const latency = Date.now() - start;

            let status: "HEALTHY" | "WARNING" | "CRITICAL" = response.ok ? "HEALTHY" : "WARNING";
            if (latency > 3000) status = "WARNING";

            metrics.push({
                metric: "CASHFREE_API",
                value: latency,
                status,
                message: response.ok
                    ? `Cashfree API responding: ${latency}ms`
                    : `Cashfree API issue: ${response.status}`,
                timestamp: new Date(),
            });
        } catch {
            metrics.push({
                metric: "CASHFREE_API",
                value: -1,
                status: "WARNING",
                message: "Cashfree API not reachable",
                timestamp: new Date(),
            });
        }
    }

    return metrics;
}

/**
 * Get application uptime in seconds
 */
function getUptime(): number {
    return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Perform full health check
 */
export async function performHealthCheck(): Promise<SystemHealth> {
    const metrics: HealthMetric[] = [];

    // Database check
    const dbMetric = await checkDatabase();
    metrics.push(dbMetric);

    // Memory check
    const memMetric = checkMemory();
    metrics.push(memMetric);

    // External services
    const externalMetrics = await checkExternalServices();
    metrics.push(...externalMetrics);

    // Determine overall status
    let overall: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";

    if (metrics.some((m) => m.status === "CRITICAL")) {
        overall = "CRITICAL";
    } else if (metrics.some((m) => m.status === "WARNING")) {
        overall = "WARNING";
    }

    return {
        overall,
        uptime: getUptime(),
        metrics,
        lastCheck: new Date(),
    };
}

/**
 * Format uptime for display
 */
export function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Get health status color for UI
 */
export function getHealthStatusColor(
    status: "HEALTHY" | "WARNING" | "CRITICAL"
): string {
    switch (status) {
        case "HEALTHY":
            return "text-green-500";
        case "WARNING":
            return "text-yellow-500";
        case "CRITICAL":
            return "text-red-500";
        default:
            return "text-gray-500";
    }
}

/**
 * Get health status badge variant
 */
export function getHealthStatusBadge(
    status: "HEALTHY" | "WARNING" | "CRITICAL"
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "HEALTHY":
            return "default";
        case "WARNING":
            return "secondary";
        case "CRITICAL":
            return "destructive";
        default:
            return "outline";
    }
}
