"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RiCheckLine, RiCloseLine, RiRefreshLine } from "react-icons/ri";

const events = [
    {
        id: "evt_1",
        event: "loan.created",
        url: "https://partner-api.com/webhooks",
        status: "success",
        timestamp: "2023-12-28T10:30:00Z",
        attempts: 1,
    },
    {
        id: "evt_2",
        event: "customer.updated",
        url: "https://partner-api.com/webhooks",
        status: "success",
        timestamp: "2023-12-28T11:15:00Z",
        attempts: 1,
    },
    {
        id: "evt_3",
        event: "loan.approved",
        url: "https://partner-api.com/webhooks",
        status: "failed",
        timestamp: "2023-12-28T12:00:00Z",
        attempts: 3,
    },
    {
        id: "evt_4",
        event: "collateral.verified",
        url: "https://partner-api.com/webhooks",
        status: "success",
        timestamp: "2023-12-28T13:45:00Z",
        attempts: 1,
    },
     {
        id: "evt_5",
        event: "loan.disbursed",
        url: "https://partner-api.com/webhooks",
        status: "pending",
        timestamp: "2023-12-28T14:20:00Z",
        attempts: 0,
    },
];

export default function WebhookEventsPage() {
    return (
        <div className="space-y-6">
             <div className="space-y-2">
                <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 w-fit">
                    Configuration
                </Badge>
                <h1 className="font-heading text-3xl font-bold tracking-tight">Webhook Events</h1>
                <p className="text-sm text-muted-foreground max-w-2xl">
                    View the delivery status of webhook events sent to your configured endpoints.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Event Log</CardTitle>
                    <CardDescription>Recent webhook delivery attempts</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Attempts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium font-mono text-xs">{event.event}</TableCell>
                                    <TableCell>
                                        {event.status === "success" && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <RiCheckLine className="mr-1 h-3 w-3" /> Success
                                            </Badge>
                                        )}
                                        {event.status === "failed" && (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                <RiCloseLine className="mr-1 h-3 w-3" /> Failed
                                            </Badge>
                                        )}
                                        {event.status === "pending" && (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                <RiRefreshLine className="mr-1 h-3 w-3 animate-spin" /> Pending
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                        {event.url}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{event.attempts}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
