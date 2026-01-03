"use client";

import { useEffect, useState } from "react";
import {
    RiLineChartLine,
    RiLoader4Line,
    RiMoneyDollarCircleLine,
    RiArrowUpLine,
    RiArrowDownLine,
    RiRefreshLine,
    RiCalendarLine,
    RiPercentLine,
} from "react-icons/ri";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";

interface ForecastData {
    month: string;
    monthName: string;
    expectedCollection: number;
    projectedCollection: number;
    previousTrend: number;
    loanCount: number;
    avgTicketSize: number;
}

interface ForecastResponse {
    forecast: ForecastData[];
    efficiency: number;
    totalExpected: number;
    totalProjected: number;
    shortfall: number;
}

export default function CashFlowPage() {
    const [data, setData] = useState<ForecastData[]>([]);
    const [summary, setSummary] = useState<{
        efficiency: number;
        totalExpected: number;
        totalProjected: number;
        shortfall: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/analytics/cash-flow");
            const resData: ForecastResponse = await response.json();

            if (response.ok) {
                setData(resData.forecast);
                setSummary({
                    efficiency: resData.efficiency,
                    totalExpected: resData.totalExpected,
                    totalProjected: resData.totalProjected,
                    shortfall: resData.shortfall,
                });
            } else {
                toast.error("Failed to load forecast");
            }
        } catch {
            toast.error("Failed to load forecast data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    const totalExpected = summary?.totalExpected || data.reduce((sum, item) => sum + item.expectedCollection, 0);
    const totalProjected = summary?.totalProjected || data.reduce((sum, item) => sum + item.projectedCollection, 0);
    const shortfall = summary?.shortfall || (totalExpected - totalProjected);
    const efficiency = summary?.efficiency || 0.95;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cash Flow Forecast</h1>
                    <p className="text-muted-foreground">
                        6-month projected collections based on EMI schedules and historical efficiency
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                        Seasonality Adjusted
                    </Badge>
                    <Button variant="outline" onClick={loadData} disabled={isLoading}>
                        <RiRefreshLine className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <RiCalendarLine className="h-4 w-4" />
                            6-Month Demand
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {formatCurrency(totalExpected)}
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Total scheduled EMIs
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                            <RiMoneyDollarCircleLine className="h-4 w-4" />
                            Projected Inflow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {formatCurrency(totalProjected)}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Risk-adjusted projection
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <RiArrowDownLine className="h-4 w-4" />
                            Expected Shortfall
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {formatCurrency(shortfall)}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Provision buffer needed
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                            <RiPercentLine className="h-4 w-4" />
                            Collection Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 flex items-center gap-1">
                            {(efficiency * 100).toFixed(1)}%
                            <RiArrowUpLine className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Historical 6-month average
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Inflow Projections</CardTitle>
                    <CardDescription>
                        Expected demand vs Projected collections with seasonality adjustments
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    {isLoading ? (
                        <div className="h-[350px] flex items-center justify-center">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis
                                        dataKey="monthName"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        className="text-xs"
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            formatCurrency(value),
                                            name === "expectedCollection" ? "Scheduled" : "Projected"
                                        ]}
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="expectedCollection"
                                        name="Scheduled Demand"
                                        fill="#94a3b8"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="projectedCollection"
                                        name="Projected Inflow"
                                        fill="#22c55e"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                    <CardDescription>
                        Detailed view with loan counts and average ticket sizes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Month</TableHead>
                                    <TableHead className="text-right">Loans Due</TableHead>
                                    <TableHead className="text-right">Avg. Ticket</TableHead>
                                    <TableHead className="text-right">Scheduled</TableHead>
                                    <TableHead className="text-right">Projected</TableHead>
                                    <TableHead className="text-right">Gap</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row) => (
                                    <TableRow key={row.month}>
                                        <TableCell className="font-medium">{row.monthName}</TableCell>
                                        <TableCell className="text-right">{row.loanCount}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatCurrency(row.avgTicketSize)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(row.expectedCollection)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-green-600">
                                            {formatCurrency(row.projectedCollection)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-amber-600">
                                            {formatCurrency(row.expectedCollection - row.projectedCollection)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
