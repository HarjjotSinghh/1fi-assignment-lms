import { db } from "@/db";
import { loans, collaterals, marginCalls, loanProducts, customers } from "@/db/schema";
import { count, sum, avg, eq, gt, gte, and, desc, sql } from "drizzle-orm";
import Link from "next/link";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiLineChartLine,
  RiPieChartLine,
  RiShieldLine,
  RiTimeLine,
  RiErrorWarningLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { LucideArrowUpRight, LucideArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { ServerRoleGate } from "@/components/auth/role-gate";

import { SimulationControls } from "@/components/dashboard/simulation-controls";

// Get portfolio risk metrics
async function getPortfolioRiskMetrics() {
  try {
    // Get all active loans with their LTV and product thresholds
    const activeLoans = await db
      .select({
        id: loans.id,
        loanNumber: loans.loanNumber,
        principalAmount: loans.principalAmount,
        outstandingPrincipal: loans.outstandingPrincipal,
        currentLtv: loans.currentLtv,
        status: loans.status,
        customerId: loans.customerId,
        productId: loans.productId,
        marginCallThreshold: loanProducts.marginCallThreshold,
        liquidationThreshold: loanProducts.liquidationThreshold,
        maxLtvPercent: loanProducts.maxLtvPercent,
      })
      .from(loans)
      .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
      .where(eq(loans.status, "ACTIVE"));

    // Calculate portfolio metrics
    const totalActiveLoans = activeLoans.length;
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0);
    
    // Average LTV across portfolio
    const avgLtv = activeLoans.length > 0
      ? activeLoans.reduce((sum, l) => sum + (l.currentLtv || 0), 0) / activeLoans.length
      : 0;

    // Loans at risk (LTV > margin call threshold)
    const loansAtRisk = activeLoans.filter(l => 
      l.currentLtv && l.marginCallThreshold && l.currentLtv >= l.marginCallThreshold
    );

    // Loans near margin call (within 5% of threshold)
    const loansNearRisk = activeLoans.filter(l => {
      if (!l.currentLtv || !l.marginCallThreshold) return false;
      const buffer = l.marginCallThreshold - l.currentLtv;
      return buffer > 0 && buffer <= 5;
    });

    // Critical loans (LTV > liquidation threshold)
    const criticalLoans = activeLoans.filter(l =>
      l.currentLtv && l.liquidationThreshold && l.currentLtv >= l.liquidationThreshold
    );

    // LTV distribution
    const ltvDistribution = {
      healthy: activeLoans.filter(l => (l.currentLtv || 0) < 40).length,
      moderate: activeLoans.filter(l => (l.currentLtv || 0) >= 40 && (l.currentLtv || 0) < 55).length,
      elevated: activeLoans.filter(l => (l.currentLtv || 0) >= 55 && (l.currentLtv || 0) < 65).length,
      high: activeLoans.filter(l => (l.currentLtv || 0) >= 65).length,
    };

    return {
      totalActiveLoans,
      totalOutstanding,
      avgLtv,
      loansAtRisk: loansAtRisk.length,
      loansAtRiskValue: loansAtRisk.reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0),
      loansNearRisk: loansNearRisk.length,
      criticalLoans: criticalLoans.length,
      ltvDistribution,
    };
  } catch (error) {
    console.error("Error fetching portfolio risk metrics:", error);
    return {
      totalActiveLoans: 0,
      totalOutstanding: 0,
      avgLtv: 0,
      loansAtRisk: 0,
      loansAtRiskValue: 0,
      loansNearRisk: 0,
      criticalLoans: 0,
      ltvDistribution: { healthy: 0, moderate: 0, elevated: 0, high: 0 },
    };
  }
}

// Get collateral concentration by fund type
async function getCollateralConcentration() {
  try {
    const pledgedCollaterals = await db
      .select({
        schemeType: collaterals.schemeType,
        fundName: collaterals.fundName,
        amcName: collaterals.amcName,
        totalValue: sum(collaterals.currentValue),
        totalUnits: sum(collaterals.units),
        count: count(),
      })
      .from(collaterals)
      .where(eq(collaterals.pledgeStatus, "PLEDGED"))
      .groupBy(collaterals.schemeType, collaterals.fundName, collaterals.amcName)
      .orderBy(desc(sum(collaterals.currentValue)))
      .limit(10);

    // Group by scheme type for pie chart
    const bySchemeType = await db
      .select({
        schemeType: collaterals.schemeType,
        totalValue: sum(collaterals.currentValue),
        count: count(),
      })
      .from(collaterals)
      .where(eq(collaterals.pledgeStatus, "PLEDGED"))
      .groupBy(collaterals.schemeType)
      .orderBy(desc(sum(collaterals.currentValue)));

    const totalCollateralValue = bySchemeType.reduce((sum, c) => sum + Number(c.totalValue || 0), 0);

    return {
      topFunds: pledgedCollaterals.map(c => ({
        fundName: c.fundName,
        amcName: c.amcName,
        schemeType: c.schemeType,
        value: Number(c.totalValue || 0),
        units: Number(c.totalUnits || 0),
        count: c.count,
        percentage: totalCollateralValue > 0 
          ? (Number(c.totalValue || 0) / totalCollateralValue) * 100 
          : 0,
      })),
      bySchemeType: bySchemeType.map(c => ({
        type: c.schemeType,
        value: Number(c.totalValue || 0),
        count: c.count,
        percentage: totalCollateralValue > 0 
          ? (Number(c.totalValue || 0) / totalCollateralValue) * 100 
          : 0,
      })),
      totalValue: totalCollateralValue,
    };
  } catch (error) {
    console.error("Error fetching collateral concentration:", error);
    return {
      topFunds: [],
      bySchemeType: [],
      totalValue: 0,
    };
  }
}

// Get active margin calls
async function getActiveMarginCalls() {
  try {
    const pendingMarginCalls = await db
      .select({
        id: marginCalls.id,
        callNumber: marginCalls.callNumber,
        triggerLtv: marginCalls.triggerLtv,
        currentLtv: marginCalls.currentLtv,
        shortfallAmount: marginCalls.shortfallAmount,
        status: marginCalls.status,
        dueDate: marginCalls.dueDate,
        createdAt: marginCalls.createdAt,
        loanId: marginCalls.loanId,
        loanNumber: loans.loanNumber,
        customerName: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
      })
      .from(marginCalls)
      .leftJoin(loans, eq(marginCalls.loanId, loans.id))
      .leftJoin(customers, eq(marginCalls.customerId, customers.id))
      .where(eq(marginCalls.status, "PENDING"))
      .orderBy(desc(marginCalls.createdAt))
      .limit(10);

    // Get margin call stats
    const [marginCallStats] = await db
      .select({
        pending: count(sql`CASE WHEN ${marginCalls.status} = 'PENDING' THEN 1 END`),
        resolved: count(sql`CASE WHEN ${marginCalls.status} = 'RESOLVED' THEN 1 END`),
        liquidated: count(sql`CASE WHEN ${marginCalls.status} = 'LIQUIDATED' THEN 1 END`),
        totalShortfall: sum(sql`CASE WHEN ${marginCalls.status} = 'PENDING' THEN ${marginCalls.shortfallAmount} ELSE 0 END`),
      })
      .from(marginCalls);

    return {
      pending: pendingMarginCalls,
      stats: {
        pending: marginCallStats?.pending || 0,
        resolved: marginCallStats?.resolved || 0,
        liquidated: marginCallStats?.liquidated || 0,
        totalShortfall: Number(marginCallStats?.totalShortfall || 0),
      },
    };
  } catch (error) {
    console.error("Error fetching margin calls:", error);
    return {
      pending: [],
      stats: { pending: 0, resolved: 0, liquidated: 0, totalShortfall: 0 },
    };
  }
}

// Calculate days until due date
function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get risk category color
function getRiskColor(category: string): string {
  switch (category) {
    case "healthy":
      return "bg-success text-success-foreground";
    case "moderate":
      return "bg-info text-info-foreground";
    case "elevated":
      return "bg-warning text-warning-foreground";
    case "high":
    case "critical":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Get scheme type color for pie chart
function getSchemeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    "EQUITY": "bg-primary",
    "DEBT": "bg-info",
    "HYBRID": "bg-accent",
    "LIQUID": "bg-success",
  };
  return colors[type] || "bg-muted";
}

export default async function RiskDashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role;

  const [metrics, concentration, marginCallData] = await Promise.all([
    getPortfolioRiskMetrics(),
    getCollateralConcentration(),
    getActiveMarginCalls(),
  ]);

  // Calculate health score (0-100)
  const portfolioHealthScore = Math.max(0, Math.min(100, 
    100 - (metrics.avgLtv * 1.2) - (metrics.loansAtRisk * 5) - (metrics.criticalLoans * 15)
  ));

  const healthCategory = portfolioHealthScore >= 80 ? "Excellent" :
    portfolioHealthScore >= 60 ? "Good" :
    portfolioHealthScore >= 40 ? "Fair" : "At Risk";

  const riskKpis = [
    {
      label: "Portfolio at Risk",
      value: metrics.loansAtRisk,
      subValue: `${formatCurrency(metrics.loansAtRiskValue)} exposure`,
      trend: metrics.loansAtRisk > 0 ? "Action needed" : "Healthy",
      direction: metrics.loansAtRisk > 0 ? "down" : "up",
      icon: RiAlertLine,
    },
    {
      label: "Average LTV",
      value: `${metrics.avgLtv.toFixed(1)}%`,
      subValue: `Target: <50%`,
      trend: metrics.avgLtv > 50 ? "Above target" : "Within target",
      direction: metrics.avgLtv > 50 ? "down" : "up",
      icon: RiLineChartLine,
    },
    {
      label: "Pending Margin Calls",
      value: marginCallData.stats.pending,
      subValue: `${formatCurrency(marginCallData.stats.totalShortfall)} shortfall`,
      trend: marginCallData.stats.pending > 0 ? "Requires resolution" : "Clear",
      direction: marginCallData.stats.pending > 0 ? "down" : "up",
      icon: RiTimeLine,
    },
    {
      label: "Critical Loans",
      value: metrics.criticalLoans,
      subValue: "Above liquidation threshold",
      trend: metrics.criticalLoans > 0 ? "Immediate action" : "None",
      direction: metrics.criticalLoans > 0 ? "down" : "up",
      icon: RiErrorWarningLine,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full bg-destructive/10 text-destructive border-destructive/20 w-fit">
            Risk Management
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Risk Dashboard</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Real-time portfolio risk monitoring, LTV tracking, and margin call management for LAMF operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SimulationControls />
          <Link href="/collateral">
            <Button variant="outline" className="rounded-none gap-2">
              <RiShieldLine className="h-4 w-4" />
              View Collateral
            </Button>
          </Link>
          <Link href="/loans">
            <Button className="rounded-none gap-2">
              <RiArrowRightLine className="h-4 w-4" />
              View All Loans
            </Button>
          </Link>
        </div>
      </section>

      {/* Portfolio Health Score */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{Math.round(portfolioHealthScore)}</span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${portfolioHealthScore}%` }}
              />
            </div>
            <Badge className={getRiskColor(healthCategory.toLowerCase().replace(" ", ""))}>
              {healthCategory}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Based on LTV distribution, margin calls, and NPA metrics.
            </p>
          </CardContent>
        </Card>

        {/* Risk KPIs */}
        {riskKpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="rounded-none p-2 bg-muted">
                  <kpi.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    kpi.direction === "down" ? "text-destructive" : "text-success"
                  }`}
                >
                  {kpi.direction === "down" ? (
                    <LucideArrowDownRight className="h-3.5 w-3.5" />
                  ) : (
                    <LucideArrowUpRight className="h-3.5 w-3.5" />
                  )}
                  {kpi.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
                <p className="text-xs text-muted-foreground">{kpi.subValue}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* LTV Distribution & Collateral Concentration */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* LTV Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiLineChartLine className="h-5 w-5 text-primary" />
              LTV Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of active loans by Loan-to-Value ratio bands.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Healthy (<40%)", count: metrics.ltvDistribution.healthy, category: "healthy" },
              { label: "Moderate (40-55%)", count: metrics.ltvDistribution.moderate, category: "moderate" },
              { label: "Elevated (55-65%)", count: metrics.ltvDistribution.elevated, category: "elevated" },
              { label: "High Risk (>65%)", count: metrics.ltvDistribution.high, category: "high" },
            ].map((band) => {
              const percentage = metrics.totalActiveLoans > 0
                ? (band.count / metrics.totalActiveLoans) * 100
                : 0;
              return (
                <div key={band.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{band.label}</span>
                    <span className="font-medium">{band.count} loans ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getRiskColor(band.category).split(" ")[0]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Active Loans</span>
                <span className="font-semibold">{metrics.totalActiveLoans}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Total Outstanding</span>
                <span className="font-semibold">{formatCurrency(metrics.totalOutstanding)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collateral Concentration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiPieChartLine className="h-5 w-5 text-primary" />
              Collateral Concentration
            </CardTitle>
            <CardDescription>
              Distribution of pledged collateral by scheme type and top funds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* By Scheme Type */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">By Scheme Type</p>
              {concentration.bySchemeType.map((scheme) => (
                <div key={scheme.type} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-sm ${getSchemeTypeColor(scheme.type)}`} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{scheme.type}</span>
                      <span className="font-medium">{scheme.percentage.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(scheme.value)} • {scheme.count} holdings
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Funds */}
            <div className="pt-4 border-t space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top 5 Funds by Value</p>
              {concentration.topFunds.slice(0, 5).map((fund, idx) => (
                <div key={`${fund.fundName}-${idx}`} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{fund.fundName}</p>
                    <p className="text-xs text-muted-foreground">{fund.amcName}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold">{formatCurrency(fund.value)}</p>
                    <p className="text-xs text-muted-foreground">{fund.percentage.toFixed(1)}% of portfolio</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Collateral Value</span>
                <span className="font-semibold">{formatCurrency(concentration.totalValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active Margin Calls */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RiAlertLine className="h-5 w-5 text-warning" />
                  Active Margin Calls
                </CardTitle>
                <CardDescription>
                  Loans that have breached LTV thresholds and require immediate attention.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{marginCallData.stats.pending} Pending</Badge>
                <Badge variant="secondary">{marginCallData.stats.resolved} Resolved</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {marginCallData.pending.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-success/10 flex items-center justify-center rounded-full mb-3">
                  <RiCheckboxCircleLine className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium">No Active Margin Calls</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All loans are within acceptable LTV limits.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {marginCallData.pending.map((call) => {
                  const daysLeft = getDaysUntilDue(call.dueDate);
                  const isUrgent = daysLeft <= 2;
                  return (
                    <div
                      key={call.id}
                      className={`flex items-center justify-between p-4 border rounded-none ${
                        isUrgent ? "border-destructive/50 bg-destructive/5" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{call.callNumber}</span>
                          {isUrgent && (
                            <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {call.customerName} • Loan: {call.loanNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          LTV: {call.currentLtv?.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Shortfall: {formatCurrency(call.shortfallAmount || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {daysLeft > 0 ? `${daysLeft} days remaining` : "Overdue"}
                        </p>
                      </div>
                      <Link href={`/loans/${call.loanId}`}>
                        <Button variant="outline" size="sm" className="rounded-none ml-4">
                          View Details
                          <RiArrowRightLine className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Loans Near Risk */}
      {metrics.loansNearRisk > 0 && (
        <section>
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <RiTimeLine className="h-5 w-5" />
                Early Warning: {metrics.loansNearRisk} Loans Approaching Threshold
              </CardTitle>
              <CardDescription>
                These loans are within 5% of margin call trigger. Consider proactive outreach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/loans?filter=near-risk">
                <Button variant="outline" className="rounded-none">
                  View Loans Near Risk
                  <RiArrowRightLine className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
