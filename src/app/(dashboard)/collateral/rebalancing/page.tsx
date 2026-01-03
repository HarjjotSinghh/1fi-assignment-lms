"use client";

import { useEffect, useState } from "react";
import {
    RiRefreshLine,
    RiLoader4Line,
    RiAlertLine,
    RiArrowUpLine,
    RiArrowDownLine,
    RiExchangeLine,
    RiMoneyDollarCircleLine,
    RiShieldCheckLine,
    RiPercentLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import Link from "next/link";

interface RebalancingAction {
    type: "TOP_UP" | "SWITCH" | "PARTIAL_REPAY";
    description: string;
    amount: number;
    impact: string;
}

interface RebalancingNeed {
    loanId: string;
    customerId: string;
    customerName: string;
    currentLtv: number;
    targetLtv: number;
    collateralValue: number;
    outstandingAmount: number;
    shortfall: number;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    suggestedActions: RebalancingAction[];
}

interface RebalancingData {
    needsRebalancing: RebalancingNeed[];
    totalLoansChecked: number;
    loansAtRisk: number;
    totalShortfall: number;
}

const urgencyColors: Record<string, string> = {
    CRITICAL: "bg-red-600",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-amber-500",
    LOW: "bg-blue-500",
};

const actionIcons: Record<string, any> = {
    TOP_UP: RiArrowUpLine,
    SWITCH: RiExchangeLine,
    PARTIAL_REPAY: RiArrowDownLine,
};

export default function RebalancingPage() {
    const [data, setData] = useState<RebalancingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Import and call the rebalancing function
            const { detectRebalancingNeeds } = await import("@/lib/rebalancing");
            const result = await detectRebalancingNeeds();
            setData(result);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load rebalancing data");
            // Set empty data for demo
            setData({
                needsRebalancing: [],
                totalLoansChecked: 0,
                loansAtRisk: 0,
                totalShortfall: 0,
            });
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

    const criticalCount = data?.needsRebalancing.filter(n => n.urgency === "CRITICAL").length || 0;
    const highCount = data?.needsRebalancing.filter(n => n.urgency === "HIGH").length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Portfolio Rebalancing</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage collateral-to-loan ratios across the portfolio
                    </p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={isLoading}>
                    <RiRefreshLine className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <RiShieldCheckLine className="h-4 w-4" />
                            Total Loans Checked
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "-" : data?.totalLoansChecked}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                            <RiAlertLine className="h-4 w-4" />
                            Loans At Risk
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {isLoading ? "-" : data?.loansAtRisk}
                        </div>
                        <div className="flex gap-2 mt-1">
                            {criticalCount > 0 && (
                                <Badge className="bg-red-600 text-xs">{criticalCount} Critical</Badge>
                            )}
                            {highCount > 0 && (
                                <Badge className="bg-orange-500 text-xs">{highCount} High</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <RiMoneyDollarCircleLine className="h-4 w-4" />
                            Total Shortfall
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "-" : formatCurrency(data?.totalShortfall || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Additional collateral needed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <RiPercentLine className="h-4 w-4" />
                            At-Risk Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading || !data?.totalLoansChecked
                                ? "-"
                                : `${((data.loansAtRisk / data.totalLoansChecked) * 100).toFixed(1)}%`}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rebalancing Needs List */}
            <Card>
                <CardHeader>
                    <CardTitle>Loans Requiring Attention</CardTitle>
                    <CardDescription>
                        Sorted by urgency level. Expand each row for suggested actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !data?.needsRebalancing.length ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <RiShieldCheckLine className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-lg font-medium">All loans are within safe LTV limits</p>
                            <p className="text-sm">No rebalancing actions needed at this time</p>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="space-y-2">
                            {data.needsRebalancing.map((item) => (
                                <AccordionItem
                                    key={item.loanId}
                                    value={item.loanId}
                                    className="border rounded-lg px-4"
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-4 w-full">
                                            <Badge className={urgencyColors[item.urgency]}>
                                                {item.urgency}
                                            </Badge>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium">{item.customerName}</p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {item.loanId.slice(0, 8)}...
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-red-600">
                                                    LTV: {item.currentLtv.toFixed(1)}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Target: {item.targetLtv}%
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    Shortfall: {formatCurrency(item.shortfall)}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="grid gap-4 md:grid-cols-2 mb-4">
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground">Outstanding Amount</p>
                                                <p className="text-lg font-bold">{formatCurrency(item.outstandingAmount)}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground">Collateral Value</p>
                                                <p className="text-lg font-bold">{formatCurrency(item.collateralValue)}</p>
                                            </div>
                                        </div>

                                        <h4 className="font-medium mb-2">Suggested Actions</h4>
                                        <div className="space-y-2">
                                            {item.suggestedActions.map((action, idx) => {
                                                const Icon = actionIcons[action.type] || RiAlertLine;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="p-2 rounded-full bg-primary/10">
                                                            <Icon className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{action.description}</p>
                                                            <p className="text-sm text-muted-foreground">{action.impact}</p>
                                                        </div>
                                                        <Button size="sm" variant="outline">
                                                            Apply
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <Link href={`/loans/${item.loanId}`}>
                                                <Button variant="outline" size="sm">View Loan</Button>
                                            </Link>
                                            <Link href={`/customers/${item.customerId}`}>
                                                <Button variant="outline" size="sm">View Customer</Button>
                                            </Link>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
