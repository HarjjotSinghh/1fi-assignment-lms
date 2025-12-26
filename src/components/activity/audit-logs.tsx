"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuditLogsAction } from "@/app/actions/audit";
import { Loader2 } from "lucide-react";

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    description: string;
    createdAt: string;
    userName: string | null;
}

export function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getAuditLogsAction();
            if (res.success && res.data) {
                setLogs(res.data);
            }
            setLoading(false);
        }
        load();
    }, []);

    function getActionColor(action: string) {
        switch (action) {
            case "CREATE": return "bg-green-100 text-green-700";
            case "UPDATE": return "bg-blue-100 text-blue-700";
            case "DELETE": return "bg-red-100 text-red-700";
            case "APPROVE": return "bg-emerald-100 text-emerald-700";
            case "REJECT": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent actions performed in the system</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] w-full pr-4">
                    <div className="space-y-4">
                        {logs.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No activity recorded yet.</p>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="flex flex-col space-y-1 pb-4 border-b last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {log.entityType}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm">{log.description}</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">by</span>
                                        <span className="text-xs font-medium">{log.userName || "System"}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
