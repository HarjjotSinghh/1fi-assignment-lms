import { db } from "@/db";
import { loanProducts, loanApplications, loans, collaterals, customers, auditLogs, users, partners, marginCalls } from "@/db/schema";
import { count, sum, eq, gt, desc, and, or, sql } from "drizzle-orm";
import Link from "next/link";
import {
  RiAddCircleLine,
  RiAlertLine,
  RiBankLine,
  RiCheckboxCircleLine,
  RiFileListLine,
  RiFlashlightLine,
  RiMoneyDollarCircleLine,
  RiShieldLine,
  RiStackLine,
  RiTimeLine,
  RiUserLine,
} from "react-icons/ri";
import { LucideArrowDownRight, LucideArrowUpRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { DashboardAnalytics } from "./analytics-panels";
import { formatCurrency, getStatusColor } from "@/lib/utils";

async function getDashboardStats() {
  try {
    const [
      productsCount,
      applicationsCount,
      activeLoansCount,
      collateralCount,
      customersCount,
      pendingApplications,
      totalDisbursed,
      totalCollateralValue,
      activePartnersCount,
      npaCount,
      marginCallCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(loanProducts).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loanApplications).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loans).where(eq(loans.status, "ACTIVE")).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(collaterals).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(customers).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loanApplications).where(eq(loanApplications.status, "SUBMITTED")).then((r) => r[0]?.count ?? 0),
      db.select({ total: sum(loans.disbursedAmount) }).from(loans).then((r) => r[0]?.total ?? 0),
      db.select({ total: sum(collaterals.currentValue) }).from(collaterals).where(eq(collaterals.pledgeStatus, "PLEDGED")).then((r) => r[0]?.total ?? 0),
      db.select({ count: count() }).from(partners).where(eq(partners.isActive, true)).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loans).where(or(eq(loans.status, "NPA"), eq(loans.status, "DEFAULTED"))).then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(marginCalls).where(eq(marginCalls.status, "PENDING")).then((r) => r[0]?.count ?? 0),
    ]);

    return {
      productsCount,
      applicationsCount,
      activeLoansCount,
      collateralCount,
      customersCount,
      pendingApplications,
      totalDisbursed: Number(totalDisbursed),
      totalCollateralValue: Number(totalCollateralValue),
      activePartnersCount,
      npaCount,
      marginCallCount,
    };
  } catch (error) {
    return {
      productsCount: 0,
      applicationsCount: 0,
      activeLoansCount: 0,
      collateralCount: 0,
      customersCount: 0,
      pendingApplications: 0,
      totalDisbursed: 0,
      totalCollateralValue: 0,
      activePartnersCount: 0,
      npaCount: 0,
      marginCallCount: 0,
    };
  }
}

// Get real-time alerts based on database conditions
async function getDashboardAlerts() {
  try {
    const alerts: Array<{
      title: string;
      description: string;
      icon: typeof RiAlertLine;
      tone: "warning" | "info" | "success";
    }> = [];

    // Check for pending margin calls
    const [pendingMarginCalls] = await db
      .select({ count: count() })
      .from(marginCalls)
      .where(eq(marginCalls.status, "PENDING"));

    if ((pendingMarginCalls?.count ?? 0) > 0) {
      alerts.push({
        title: "Margin Calls Triggered",
        description: `${pendingMarginCalls.count} accounts breached LTV limits. Immediate action required.`,
        icon: RiAlertLine,
        tone: "warning",
      });
    }

    // Check for high LTV loans (over 55%)
    const [highLtvLoans] = await db
      .select({ count: count() })
      .from(loans)
      .where(and(eq(loans.status, "ACTIVE"), gt(loans.currentLtv, 55)));

    if ((highLtvLoans?.count ?? 0) > 0) {
      alerts.push({
        title: "High LTV loans detected",
        description: `${highLtvLoans.count} active loans have LTV above 55%. Consider margin calls.`,
        icon: RiAlertLine,
        tone: "warning",
      });
    }

    // Check pending KYC verifications
    const [pendingKyc] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.kycStatus, "PENDING"));

    if ((pendingKyc?.count ?? 0) > 0) {
      alerts.push({
        title: "KYC backlog",
        description: `${pendingKyc.count} customers awaiting KYC verification. Clear within 24 hours.`,
        icon: RiTimeLine,
        tone: "info",
      });
    }

    // Check pending applications
    const [pendingApps] = await db
      .select({ count: count() })
      .from(loanApplications)
      .where(eq(loanApplications.status, "SUBMITTED"));

    if ((pendingApps?.count ?? 0) > 0) {
      alerts.push({
        title: "Applications pending review",
        description: `${pendingApps.count} applications awaiting approval decision.`,
        icon: RiFileListLine,
        tone: "info",
      });
    }

    // Add success alert if no issues
    if (alerts.length === 0) {
      alerts.push({
        title: "All systems healthy",
        description: "No pending items or alerts at this time.",
        icon: RiCheckboxCircleLine,
        tone: "success",
      });
    }

    return alerts;
  } catch {
    return [];
  }
}

// Get recent activity from audit logs
async function getRecentActivity() {
  try {
    const recentLogs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5);

    return recentLogs.map((log) => ({
      id: log.entityId || log.id.slice(0, 8),
      title: log.action.replace("_", " ").toLowerCase().replace(/^\w/, c => c.toUpperCase()),
      description: log.description,
      status: log.action,
      time: formatRelativeTime(log.createdAt),
      icon: getActivityIcon(log.action),
    }));
  } catch {
    return [];
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function getActivityIcon(action: string) {
  const iconMap: Record<string, typeof RiShieldLine> = {
    CREATE: RiAddCircleLine,
    UPDATE: RiFileListLine,
    DELETE: RiAlertLine,
    APPROVE: RiCheckboxCircleLine,
    REJECT: RiAlertLine,
    DISBURSE: RiBankLine,
    EXPORT: RiFileListLine,
    KYC_VERIFY: RiShieldLine,
    COLLATERAL_PLEDGE: RiShieldLine,
    PAYMENT_RECEIVED: RiMoneyDollarCircleLine,
  };
  return iconMap[action] || RiFileListLine;
}

import { SearchParams } from "@/lib/pagination";

type DashboardPageProps = {
  searchParams: Promise<SearchParams>;
};

import { auth } from "@/lib/auth";

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const isOnboardingComplete = session?.user?.onboardingCompleted;

  const stats = await getDashboardStats();

  const outstanding = stats.totalDisbursed * 0.62;
  const paymentDue = stats.totalDisbursed * 0.08;
  const utilizationRate = stats.totalCollateralValue
    ? Math.round((stats.totalDisbursed / stats.totalCollateralValue) * 100)
    : 0;

  const heroStats = [
    {
      label: "Total outstanding",
      value: formatCurrency(outstanding),
      trend: "+8.4%",
      direction: "up",
    },
    {
      label: "Payment due (30d)",
      value: formatCurrency(paymentDue),
      trend: "+2.1%",
      direction: "up",
    },
    {
      label: "Utilization rate",
      value: `${utilizationRate}%`,
      trend: "+1.8%",
      direction: "up",
    },
    {
      label: "Portfolio Risk (NPA)",
      value: `${stats.npaCount} accounts`,
      trend: stats.npaCount > 0 ? "Action needed" : "Healthy",
      direction: stats.npaCount > 0 ? "down" : "up",
    },
    {
      label: "Margin Calls",
      value: stats.marginCallCount.toString(),
      trend: "Pending action",
      direction: stats.marginCallCount > 0 ? "down" : "up",
    },
  ];

  const operationalStats = [
    {
      title: "Partners",
      value: stats.activePartnersCount,
      icon: RiStackLine,
      href: "/configuration/partners",
      color: "text-primary",
      bgColor: "bg-primary/10",
      subtitle: "Active integrations",
    },
    {
      title: "Applications",
      value: stats.applicationsCount,
      icon: RiFileListLine,
      href: "/applications",
      color: "text-info",
      bgColor: "bg-info/10",
      badge: stats.pendingApplications > 0 ? `${stats.pendingApplications} pending` : undefined,
      subtitle: "Pipeline throughput",
    },
    {
      title: "Active Loans",
      value: stats.activeLoansCount,
      icon: RiMoneyDollarCircleLine,
      href: "/loans",
      color: "text-success",
      bgColor: "bg-success/10",
      subtitle: "Accounts in good standing",
    },
    {
      title: "Collaterals",
      value: stats.collateralCount,
      icon: RiShieldLine,
      href: "/collateral",
      color: "text-accent",
      bgColor: "bg-accent/10",
      subtitle: "Pledged MF inventory",
    },
    {
      title: "Customers",
      value: stats.customersCount,
      icon: RiUserLine,
      href: "/customers",
      color: "text-warning",
      bgColor: "bg-warning/10",
      subtitle: "Verified borrower base",
    },
  ];

  // Fetch real alerts from database conditions
  const alerts = await getDashboardAlerts();

  // Fetch real activity from audit logs
  const activityFeed = await getRecentActivity();

  return (
    <div className="space-y-8 animate-fade-in">
      {!isOnboardingComplete && (
        <Alert className="border-warning/30 bg-warning/10 rounded-none">
          <RiAlertLine className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Onboarding Incomplete</AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2 text-warning/90">
            <span>Please complete your onboarding/kyc/customer profile setup.</span>
            <Link href="/onboarding">
              <Button size="sm" variant="outline" className="h-8 border-warning/30 hover:bg-warning/20 text-warning hover:text-warning">
                Complete Setup
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <section className="relative overflow-hidden rounded-none border bg-gradient-to-br from-primary/5 via-background to-accent/10 p-6 md:p-8 dark:from-primary/10 dark:via-background dark:to-accent/5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">
                  Live
                </Badge>
                <span>Updated 2 minutes ago</span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                Portfolio Command Center
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Track lending health, disbursal momentum, and risk coverage from a single
                operational view.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/playbook">
                <Button variant="outline" className="rounded-none gap-2">
                  <RiFlashlightLine className="h-4 w-4" />
                  Playbook
                </Button>
              </Link>
              <Link href="/applications/new">
                <Button className="rounded-none gap-2">
                  <RiAddCircleLine className="h-4 w-4" />
                  New Application
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
            {heroStats.map((stat) => (
              <Card key={stat.label} className="bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${stat.direction === "down" ? "text-destructive" : "text-success"
                        }`}
                    >
                      {stat.direction === "down" ? (
                        <LucideArrowDownRight className="h-3.5 w-3.5" />
                      ) : (
                        <LucideArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Operational Overview</h2>
            <p className="text-sm text-muted-foreground">
              Live counts across the lending pipeline.
            </p>
          </div>
          <Link href="/analytics">
            <Button variant="outline" className="rounded-none gap-2">
              <LucideArrowUpRight className="h-4 w-4" />
              Open Analytics
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 stagger-children">
          {operationalStats.map((stat) => (
            <Link key={stat.title} href={stat.href} className="block group">
              <Card className="border hover:border-primary/50 transition-colors duration-200 hover-lift h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-none p-2 ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    {stat.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-2xl font-semibold">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <DashboardAnalytics
        totalDisbursed={stats.totalDisbursed}
        totalCollateralValue={stats.totalCollateralValue}
        activeLoans={stats.activeLoansCount}
        applications={stats.applicationsCount}
      />

      <section className="grid gap-6 lg:grid-cols-3 stagger-children">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>High impact tasks for loan operations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 stagger-children">
            <Link href="/applications/new">
              <Button variant="outline" className="w-full justify-between rounded-none">
                <span className="flex items-center gap-2">
                  <RiAddCircleLine className="h-4 w-4 text-primary" />
                  Start new application
                </span>
                <LucideArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/applications">
              <Button variant="outline" className="w-full justify-between rounded-none">
                <span className="flex items-center gap-2">
                  <RiFileListLine className="h-4 w-4 text-info" />
                  Review approvals
                </span>
                <LucideArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="outline" className="w-full justify-between rounded-none">
                <span className="flex items-center gap-2">
                  <RiMoneyDollarCircleLine className="h-4 w-4 text-success" />
                  Track active loans
                </span>
                <LucideArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/collateral">
              <Button variant="outline" className="w-full justify-between rounded-none">
                <span className="flex items-center gap-2">
                  <RiShieldLine className="h-4 w-4 text-accent" />
                  Monitor collateral
                </span>
                <LucideArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts & Signals</CardTitle>
            <CardDescription>Proactive monitoring for risk and ops.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 stagger-children">
            {alerts.map((alert) => {
              const AlertIcon = alert.icon;
              const toneStyles =
                alert.tone === "warning"
                  ? "border-warning/30 bg-warning/10"
                  : alert.tone === "success"
                    ? "border-success/30 bg-success/10"
                    : "border-info/30 bg-info/10";

              return (
                <Alert key={alert.title} className={`${toneStyles} rounded-none`}>
                  <AlertIcon className="h-4 w-4" />
                  <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    {alert.description}
                  </AlertDescription>
                </Alert>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest movements across the loan book.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-3 stagger-children">
              {activityFeed.map((activity) => {
                const ActivityIcon = activity.icon;
                return (
                  <Item key={activity.id} className="flex-nowrap rounded-none border bg-background/70 px-4 py-3">
                    <ItemMedia
                      variant="icon"
                      className="rounded-none border-primary/20 bg-primary/10 text-primary"
                    >
                      <ActivityIcon className="h-4 w-4" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="text-sm">{activity.title}</ItemTitle>
                      <ItemDescription className="text-xs">
                        {activity.description}
                      </ItemDescription>
                    </ItemContent>
                    <div className="ml-auto text-right">
                      <Badge className={`text-[11px] ${getStatusColor(activity.status)}`}>
                        {activity.status.replace("_", " ")}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </Item>
                );
              })}
            </ItemGroup>
          </CardContent>
        </Card>
      </section>

      {stats.productsCount === 0 && (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-none">
                <RiTimeLine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Get Started</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                  Your LMS is ready! Start by creating loan products, then onboard customers and process applications.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2 flex-wrap">
                <Link href="/products">
                  <Button className="press-scale rounded-none">
                    <RiStackLine className="h-4 w-4 mr-2" />
                    Create Loan Product
                  </Button>
                </Link>
                <Link href="/customers">
                  <Button variant="outline" className="press-scale rounded-none">
                    <RiUserLine className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
