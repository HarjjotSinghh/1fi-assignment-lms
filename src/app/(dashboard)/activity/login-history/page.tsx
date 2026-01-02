"use client";

import { useEffect, useState } from "react";
import { 
    RiHistoryLine, 
    RiCheckLine, 
    RiCloseLine,
    RiLoader4Line,
    RiFilterLine,
    RiShieldKeyholeLine,
    RiGlobalLine,
    RiComputerLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface LoginEntry {
    id: string;
    userId: string | null;
    success: boolean;
    ipAddress: string | null;
    userAgent: string | null;
    location: string | null;
    failureReason: string | null;
    mfaUsed: boolean;
    sessionId: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string } | null;
}

interface Stats {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueUsers: number;
}

export default function LoginHistoryPage() {
    const [history, setHistory] = useState<LoginEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({
        success: "",
        from: "",
        to: "",
    });

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.success !== "") params.set("success", filter.success);
            if (filter.from) params.set("from", filter.from);
            if (filter.to) params.set("to", filter.to);

            const response = await fetch(`/api/admin/login-history?${params.toString()}`);
            const data = await response.json();
            
            if (response.ok) {
                setHistory(data.history);
                setStats(data.stats);
            } else {
                toast.error(data.error || "Failed to load login history");
            }
        } catch {
            toast.error("Failed to load login history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const applyFilter = () => {
        loadHistory();
    };

    const clearFilter = () => {
        setFilter({ success: "", from: "", to: "" });
        setTimeout(loadHistory, 0);
    };

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return "Unknown";
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari")) return "Safari";
        if (ua.includes("Edge")) return "Edge";
        return "Unknown Browser";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Login History</h1>
                    <p className="text-muted-foreground">
                        Monitor user login activity and security events
                    </p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <RiFilterLine className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={filter.success}
                                    onValueChange={(value) => setFilter({ ...filter, success: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        <SelectItem value="true">Successful</SelectItem>
                                        <SelectItem value="false">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>From</Label>
                                    <Input
                                        type="date"
                                        value={filter.from}
                                        onChange={(e) => setFilter({ ...filter, from: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>To</Label>
                                    <Input
                                        type="date"
                                        value={filter.to}
                                        onChange={(e) => setFilter({ ...filter, to: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={clearFilter} className="flex-1">
                                    Clear
                                </Button>
                                <Button size="sm" onClick={applyFilter} className="flex-1">
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.totalLogins}</div>
                            <p className="text-sm text-muted-foreground">Total Logins</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.successfulLogins}</div>
                            <p className="text-sm text-muted-foreground">Successful</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">{stats.failedLogins}</div>
                            <p className="text-sm text-muted-foreground">Failed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                            <p className="text-sm text-muted-foreground">Unique Users</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>
                        Recent login attempts across all users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RiHistoryLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No login activity recorded</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Browser</TableHead>
                                    <TableHead>MFA</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            {entry.success ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    <RiCheckLine className="h-3 w-3 mr-1" />
                                                    Success
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <RiCloseLine className="h-3 w-3 mr-1" />
                                                    Failed
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {entry.user ? (
                                                <div>
                                                    <div className="font-medium">{entry.user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{entry.user.email}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Unknown</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {entry.ipAddress || (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {entry.location ? (
                                                <div className="flex items-center gap-1">
                                                    <RiGlobalLine className="h-3 w-3 text-muted-foreground" />
                                                    {entry.location}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <RiComputerLine className="h-3 w-3 text-muted-foreground" />
                                                {parseUserAgent(entry.userAgent)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {entry.mfaUsed ? (
                                                <RiShieldKeyholeLine className="h-4 w-4 text-green-500" title="MFA Used" />
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</div>
                                            <div className="text-xs">{format(new Date(entry.createdAt), "PPp")}</div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
