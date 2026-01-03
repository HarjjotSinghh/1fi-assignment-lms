import { db } from "@/db";
import { watchlist, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiEyeLine, RiSearchLine, RiUserForbidLine } from "react-icons/ri";
import { AddWatchlistDialog } from "@/components/watchlist/add-watchlist-dialog";

export default async function WatchlistPage() {
    const entries = await db
        .select({
            id: watchlist.id,
            entityType: watchlist.entityType,
            value: watchlist.entityValue,
            reason: watchlist.reason,
            listType: watchlist.listType,
            createdAt: watchlist.addedAt,
            addedByName: users.name,
        })
        .from(watchlist)
        .leftJoin(users, eq(watchlist.addedById, users.id))
        .orderBy(desc(watchlist.addedAt));

    return (
        <div className="space-y-6 animate-fade-in text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                        <RiEyeLine className="h-6 w-6 text-primary" />
                        Watchlist Monitor
                    </h1>
                    <p className="text-muted-foreground">
                        Manage blacklisted entities and high-risk monitoring signals.
                    </p>
                </div>
                <AddWatchlistDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-destructive/10 border-destructive/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">High Risk Entities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {entries.filter(e => e.listType === "BLACKLIST").length}
                        </div>
                        <p className="text-xs text-destructive/80">Require immediate freeze</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Monitored</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entries.length}</div>
                        <p className="text-xs text-muted-foreground">Across PAN, Aadhaar, and Names</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Watchlist Entries</CardTitle>
                        <div className="relative w-64">
                            <RiSearchLine className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search value..." className="pl-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entity Value</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>List Type</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Added By</TableHead>
                                <TableHead>Date Added</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No entities in watchlist.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-mono">{entry.value}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{entry.entityType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                entry.listType === "BLACKLIST" ? "bg-destructive text-destructive-foreground" :
                                                    entry.listType === "GREYLIST" ? "bg-warning text-warning-foreground" :
                                                        "bg-secondary"
                                            }>
                                                {entry.listType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate">{entry.reason}</TableCell>
                                        <TableCell>{entry.addedByName || "System"}</TableCell>
                                        <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
