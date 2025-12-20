import { db } from "@/db";
import { loanApplications, loans, collaterals } from "@/db/schema";
import { count, sum, eq } from "drizzle-orm";
import {
  RiDownloadLine,
  RiFileChartLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardAnalytics } from "../dashboard/analytics-panels";
import { formatCurrency } from "@/lib/utils";
import { LucideArrowDownRight, LucideArrowUpRight } from "lucide-react";

async function getAnalyticsStats() {
  try {
    const [applicationsCount, activeLoansCount, totalDisbursed, totalCollateralValue] =
      await Promise.all([
        db.select({ count: count() }).from(loanApplications).then((r) => r[0]?.count ?? 0),
        db.select({ count: count() }).from(loans).where(eq(loans.status, "ACTIVE")).then((r) => r[0]?.count ?? 0),
        db.select({ total: sum(loans.disbursedAmount) }).from(loans).then((r) => r[0]?.total ?? 0),
        db.select({ total: sum(collaterals.currentValue) }).from(collaterals).where(eq(collaterals.pledgeStatus, "PLEDGED")).then((r) => r[0]?.total ?? 0),
      ]);

    return {
      applicationsCount,
      activeLoansCount,
      totalDisbursed: Number(totalDisbursed),
      totalCollateralValue: Number(totalCollateralValue),
    };
  } catch (error) {
    return {
      applicationsCount: 0,
      activeLoansCount: 0,
      totalDisbursed: 0,
      totalCollateralValue: 0,
    };
  }
}

export default async function AnalyticsPage() {
  const stats = await getAnalyticsStats();
  const outstanding = stats.totalDisbursed * 0.62;
  const defaultRate = 2.1;
  const avgApproval = 2.4;

  const kpis = [
    {
      label: "Total disbursed",
      value: formatCurrency(stats.totalDisbursed),
      trend: "+12.4%",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(outstanding),
      trend: "+4.1%",
    },
    {
      label: "Default rate",
      value: `${defaultRate}%`,
      trend: "-0.3%",
    },
    {
      label: "Avg approval time",
      value: `${avgApproval} days`,
      trend: "-12%",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 w-fit">
            Analytics
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Loan Analytics</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Deep dive into portfolio performance, origination trends, and repayment health.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-none gap-2">
            <RiFileChartLine className="h-4 w-4" />
            Export PDF
          </Button>
          <Button className="rounded-none gap-2">
            <RiDownloadLine className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const isNegative = kpi.trend.startsWith("-");
          return (
            <Card key={kpi.label} className="bg-card/80">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
                <div
                  className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                    isNegative ? "text-destructive" : "text-success"
                  }`}
                >
                  {isNegative ? (
                    <LucideArrowDownRight className="h-3.5 w-3.5" />
                  ) : (
                    <LucideArrowUpRight className="h-3.5 w-3.5" />
                  )}
                  {kpi.trend} vs last quarter
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <DashboardAnalytics
        totalDisbursed={stats.totalDisbursed}
        totalCollateralValue={stats.totalCollateralValue}
        activeLoans={stats.activeLoansCount}
        applications={stats.applicationsCount}
      />
    </div>
  );
}
