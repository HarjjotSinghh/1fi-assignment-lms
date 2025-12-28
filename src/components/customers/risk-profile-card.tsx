"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    RiShieldCheckLine,
    RiAlertLine,
    RiErrorWarningLine,
    RiCheckboxCircleLine,
    RiTrophyLine,
    RiBarChartLine,
    RiMoneyDollarCircleLine,
    RiTimeLine,
    RiPercentLine,
    RiInformationLine,
} from "react-icons/ri";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CustomerRiskData {
    // Basic info
    firstName: string;
    lastName: string;
    
    // Financial indicators
    creditScore?: number | null;
    riskScore?: number | null;
    monthlyIncome?: number | null;
    
    // Loan metrics
    totalLoans: number;
    activeLoans: number;
    totalOutstanding: number;
    totalDisbursed: number;
    
    // Payment history
    paidOnTime: number;
    overduePayments: number;
    totalPayments: number;
    
    // Collateral
    totalCollateralValue: number;
    currentLtv: number;
    
    // KYC
    kycStatus: string;
    aadhaarVerified?: boolean;
    panVerified?: boolean;
}

interface RiskProfileProps {
    data: CustomerRiskData;
    compact?: boolean;
}

type RiskCategory = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "HIGH_RISK";

const riskCategoryConfig: Record<RiskCategory, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    EXCELLENT: {
        label: "Excellent",
        color: "text-emerald-600",
        bgColor: "bg-emerald-500/10 border-emerald-500/20",
        icon: <RiTrophyLine className="h-5 w-5" />,
    },
    GOOD: {
        label: "Good",
        color: "text-success",
        bgColor: "bg-success/10 border-success/20",
        icon: <RiCheckboxCircleLine className="h-5 w-5" />,
    },
    FAIR: {
        label: "Fair",
        color: "text-amber-600",
        bgColor: "bg-amber-500/10 border-amber-500/20",
        icon: <RiInformationLine className="h-5 w-5" />,
    },
    POOR: {
        label: "Poor",
        color: "text-warning",
        bgColor: "bg-warning/10 border-warning/20",
        icon: <RiAlertLine className="h-5 w-5" />,
    },
    HIGH_RISK: {
        label: "High Risk",
        color: "text-destructive",
        bgColor: "bg-destructive/10 border-destructive/20",
        icon: <RiErrorWarningLine className="h-5 w-5" />,
    },
};

function getCreditScoreCategory(score: number | null | undefined): RiskCategory {
    if (!score) return "FAIR";
    if (score >= 800) return "EXCELLENT";
    if (score >= 700) return "GOOD";
    if (score >= 600) return "FAIR";
    if (score >= 500) return "POOR";
    return "HIGH_RISK";
}

function getCreditScoreColor(score: number | null | undefined): string {
    if (!score) return "text-muted-foreground";
    if (score >= 800) return "text-emerald-600";
    if (score >= 700) return "text-success";
    if (score >= 600) return "text-amber-600";
    if (score >= 500) return "text-warning";
    return "text-destructive";
}

function getCreditScorePercent(score: number | null | undefined): number {
    if (!score) return 0;
    return Math.min(100, Math.max(0, ((score - 300) / 600) * 100));
}

export function CustomerRiskProfileCard({ data, compact = false }: RiskProfileProps) {
    // Calculate overall risk assessment
    const riskAssessment = useMemo(() => {
        let score = 50; // Start neutral

        // Credit score impact (40%)
        if (data.creditScore) {
            if (data.creditScore >= 800) score += 40;
            else if (data.creditScore >= 700) score += 30;
            else if (data.creditScore >= 600) score += 15;
            else if (data.creditScore >= 500) score -= 10;
            else score -= 25;
        }

        // Payment history (30%)
        if (data.totalPayments > 0) {
            const onTimeRate = data.paidOnTime / data.totalPayments;
            score += (onTimeRate - 0.5) * 60; // -30 to +30
        }

        // LTV ratio (15%)
        if (data.currentLtv < 40) score += 15;
        else if (data.currentLtv < 50) score += 10;
        else if (data.currentLtv < 60) score += 0;
        else if (data.currentLtv < 70) score -= 10;
        else score -= 15;

        // KYC status (10%)
        if (data.kycStatus === "VERIFIED") score += 10;
        else if (data.kycStatus === "IN_PROGRESS") score += 3;
        else score -= 5;

        // Risk score adjustment (5%)
        if (data.riskScore) {
            if (data.riskScore <= 20) score += 5;
            else if (data.riskScore <= 40) score += 2;
            else if (data.riskScore >= 70) score -= 10;
        }

        // Clamp to 0-100
        score = Math.max(0, Math.min(100, score));

        // Determine category
        let category: RiskCategory;
        if (score >= 85) category = "EXCELLENT";
        else if (score >= 70) category = "GOOD";
        else if (score >= 50) category = "FAIR";
        else if (score >= 30) category = "POOR";
        else category = "HIGH_RISK";

        return { score, category };
    }, [data]);

    const categoryConfig = riskCategoryConfig[riskAssessment.category];
    const paymentSuccessRate = data.totalPayments > 0
        ? Math.round((data.paidOnTime / data.totalPayments) * 100)
        : 100;

    if (compact) {
        return (
            <Card className={`${categoryConfig.bgColor} border`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-none ${categoryConfig.bgColor}`}>
                                <span className={categoryConfig.color}>{categoryConfig.icon}</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Risk Profile</p>
                                <p className={`font-semibold ${categoryConfig.color}`}>
                                    {categoryConfig.label}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Credit Score</p>
                            <p className={`text-xl font-bold font-mono ${getCreditScoreColor(data.creditScore)}`}>
                                {data.creditScore || "N/A"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <RiShieldCheckLine className="h-4 w-4" />
                            Risk Profile
                        </CardTitle>
                        <CardDescription>
                            Financial health and risk assessment
                        </CardDescription>
                    </div>
                    <Badge className={`gap-1.5 px-3 py-1 ${categoryConfig.bgColor}`}>
                        <span className={categoryConfig.color}>{categoryConfig.icon}</span>
                        <span className={categoryConfig.color}>{categoryConfig.label}</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Credit Score Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1 cursor-help">
                                        <RiBarChartLine className="h-4 w-4" />
                                        Credit Score (CIBIL)
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Score range: 300-900</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className={`text-2xl font-bold font-mono ${getCreditScoreColor(data.creditScore)}`}>
                            {data.creditScore || "N/A"}
                        </span>
                    </div>
                    <Progress
                        value={getCreditScorePercent(data.creditScore)}
                        className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Poor (300)</span>
                        <span>Excellent (900)</span>
                    </div>
                </div>

                {/* Key Indicators Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Monthly Income */}
                    <div className="space-y-1 p-3 rounded-none bg-muted/30">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RiMoneyDollarCircleLine className="h-3.5 w-3.5" />
                            Monthly Income
                        </div>
                        <p className="font-semibold font-mono">
                            {data.monthlyIncome ? formatCurrency(data.monthlyIncome) : "N/A"}
                        </p>
                    </div>

                    {/* Current LTV */}
                    <div className="space-y-1 p-3 rounded-none bg-muted/30">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RiPercentLine className="h-3.5 w-3.5" />
                            Current LTV
                        </div>
                        <p className={`font-semibold font-mono ${data.currentLtv > 60 ? "text-warning" : data.currentLtv > 70 ? "text-destructive" : ""}`}>
                            {data.currentLtv.toFixed(1)}%
                        </p>
                    </div>

                    {/* Total Outstanding */}
                    <div className="space-y-1 p-3 rounded-none bg-muted/30">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RiTimeLine className="h-3.5 w-3.5" />
                            Outstanding
                        </div>
                        <p className="font-semibold font-mono">
                            {formatCurrency(data.totalOutstanding)}
                        </p>
                    </div>

                    {/* Collateral Value */}
                    <div className="space-y-1 p-3 rounded-none bg-muted/30">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RiShieldCheckLine className="h-3.5 w-3.5" />
                            Collateral
                        </div>
                        <p className="font-semibold font-mono">
                            {formatCurrency(data.totalCollateralValue)}
                        </p>
                    </div>
                </div>

                {/* Payment History */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment History</span>
                        <span className={`font-medium ${paymentSuccessRate >= 90 ? "text-success" : paymentSuccessRate >= 70 ? "text-warning" : "text-destructive"}`}>
                            {paymentSuccessRate}% on-time
                        </span>
                    </div>
                    <Progress
                        value={paymentSuccessRate}
                        className="h-1.5"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{data.paidOnTime} on-time</span>
                        <span>{data.overduePayments} overdue</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Active Loans</span>
                    <Badge variant="outline">{data.activeLoans} of {data.totalLoans}</Badge>
                </div>

                {/* KYC Status */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">KYC Verification</span>
                    <div className="flex items-center gap-2">
                        {data.aadhaarVerified && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                                <RiCheckboxCircleLine className="h-3 w-3" />
                                Aadhaar
                            </Badge>
                        )}
                        {data.panVerified && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                                <RiCheckboxCircleLine className="h-3 w-3" />
                                PAN
                            </Badge>
                        )}
                        {!data.aadhaarVerified && !data.panVerified && (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                Pending
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Risk Score */}
                {data.riskScore && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Internal Risk Score</span>
                        <span className={`font-mono font-medium ${data.riskScore <= 30 ? "text-success" : data.riskScore <= 60 ? "text-warning" : "text-destructive"}`}>
                            {data.riskScore}/100
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
