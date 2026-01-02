"use client";

import { useEffect, useState } from "react";
import { 
    RiPulseLine, 
    RiRefreshLine,
    RiCheckLine,
    RiAlertLine,
    RiCloseLine,
    RiLoader4Line,
    RiServerLine,
    RiDatabase2Line,
    RiCloudLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

interface HealthMetric {
    metric: string;
    value: number;
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    message: string;
    timestamp: string;
}

interface SystemHealth {
    overall: "HEALTHY" | "WARNING" | "CRITICAL";
    uptime: number;
    uptimeFormatted: string;
    metrics: HealthMetric[];
    lastCheck: string;
}

export default function SystemHealthPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const loadHealth = async () => {
        try {
            const response = await fetch("/api/admin/health");
            const data = await response.json();
            setHealth(data);
        } catch {
            setHealth({
                overall: "CRITICAL",
                uptime: 0,
                uptimeFormatted: "Unknown",
                metrics: [
                    {
                        metric: "API_CHECK",
                        value: -1,
                        status: "CRITICAL",
                        message: "Failed to fetch health status",
                        timestamp: new Date().toISOString(),
                    },
                ],
                lastCheck: new Date().toISOString(),
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHealth();

        // Auto-refresh every 30 seconds
        let interval: NodeJS.Timeout | undefined;
        if (autoRefresh) {
            interval = setInterval(loadHealth, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const getStatusIcon = (status: "HEALTHY" | "WARNING" | "CRITICAL") => {
        switch (status) {
            case "HEALTHY":
                return <RiCheckLine className="h-5 w-5 text-green-500" />;
            case "WARNING":
                return <RiAlertLine className="h-5 w-5 text-yellow-500" />;
            case "CRITICAL":
                return <RiCloseLine className="h-5 w-5 text-red-500" />;
        }
    };

    const getStatusBadge = (status: "HEALTHY" | "WARNING" | "CRITICAL") => {
        switch (status) {
            case "HEALTHY":
                return <Badge className="bg-green-500 hover:bg-green-600">Healthy</Badge>;
            case "WARNING":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
            case "CRITICAL":
                return <Badge variant="destructive">Critical</Badge>;
        }
    };

    const getMetricIcon = (metric: string) => {
        switch (metric) {
            case "DATABASE_LATENCY":
                return <RiDatabase2Line className="h-5 w-5" />;
            case "MEMORY_USAGE":
                return <RiServerLine className="h-5 w-5" />;
            case "CASHFREE_API":
                return <RiCloudLine className="h-5 w-5" />;
            default:
                return <RiPulseLine className="h-5 w-5" />;
        }
    };

    const getMetricLabel = (metric: string) => {
        switch (metric) {
            case "DATABASE_LATENCY":
                return "Database";
            case "MEMORY_USAGE":
                return "Memory";
            case "CASHFREE_API":
                return "Cashfree API";
            default:
                return metric;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
                    <p className="text-muted-foreground">
                        Monitor system performance and service status
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                    </Button>
                    <Button variant="outline" onClick={loadHealth} disabled={isLoading}>
                        <RiRefreshLine className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {isLoading && !health ? (
                <div className="flex items-center justify-center py-16">
                    <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : health ? (
                <>
                    {/* Overall Status Card */}
                    <Card className={`border-2 ${
                        health.overall === "HEALTHY" ? "border-green-500/20 bg-green-50/50 dark:bg-green-950/20" :
                        health.overall === "WARNING" ? "border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20" :
                        "border-red-500/20 bg-red-50/50 dark:bg-red-950/20"
                    }`}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                                        health.overall === "HEALTHY" ? "bg-green-100 dark:bg-green-900" :
                                        health.overall === "WARNING" ? "bg-yellow-100 dark:bg-yellow-900" :
                                        "bg-red-100 dark:bg-red-900"
                                    }`}>
                                        {getStatusIcon(health.overall)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">
                                            System {health.overall === "HEALTHY" ? "Operational" : health.overall}
                                        </CardTitle>
                                        <CardDescription>
                                            Uptime: {health.uptimeFormatted}
                                        </CardDescription>
                                    </div>
                                </div>
                                {getStatusBadge(health.overall)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Last checked {formatDistanceToNow(new Date(health.lastCheck), { addSuffix: true })}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Metrics Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {health.metrics.map((metric) => (
                            <Card key={metric.metric}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getMetricIcon(metric.metric)}
                                            <CardTitle className="text-base">
                                                {getMetricLabel(metric.metric)}
                                            </CardTitle>
                                        </div>
                                        {getStatusBadge(metric.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {metric.message}
                                    </p>
                                    {metric.metric === "MEMORY_USAGE" && metric.value >= 0 && (
                                        <Progress value={metric.value} className="h-2" />
                                    )}
                                    {metric.metric === "DATABASE_LATENCY" && metric.value >= 0 && (
                                        <p className="text-2xl font-bold">{metric.value}ms</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* System Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>System Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Node.js Version</p>
                                    <p className="font-medium">{typeof process !== 'undefined' ? process.version : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Platform</p>
                                    <p className="font-medium">{typeof process !== 'undefined' ? process.platform : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Environment</p>
                                    <p className="font-medium">{process.env.NODE_ENV || 'development'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Uptime</p>
                                    <p className="font-medium">{health.uptimeFormatted}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
