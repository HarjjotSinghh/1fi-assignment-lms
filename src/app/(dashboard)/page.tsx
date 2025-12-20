import { db } from "@/db";
import { loanProducts, loanApplications, loans, collaterals, customers } from "@/db/schema";
import { count, sum, eq, sql } from "drizzle-orm";
import Link from "next/link";
import {
  Package,
  FileText,
  CircleDollarSign,
  Shield,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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
    ] = await Promise.all([
      db.select({ count: count() }).from(loanProducts).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loanApplications).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loans).where(eq(loans.status, "ACTIVE")).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(collaterals).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(customers).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(loanApplications).where(eq(loanApplications.status, "SUBMITTED")).then(r => r[0]?.count ?? 0),
      db.select({ total: sum(loans.disbursedAmount) }).from(loans).then(r => r[0]?.total ?? 0),
      db.select({ total: sum(collaterals.currentValue) }).from(collaterals).where(eq(collaterals.pledgeStatus, "PLEDGED")).then(r => r[0]?.total ?? 0),
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
    };
  } catch (error) {
    // Return default values if database is not set up yet
    return {
      productsCount: 0,
      applicationsCount: 0,
      activeLoansCount: 0,
      collateralCount: 0,
      customersCount: 0,
      pendingApplications: 0,
      totalDisbursed: 0,
      totalCollateralValue: 0,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Loan Products",
      value: stats.productsCount,
      icon: Package,
      href: "/products",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Applications",
      value: stats.applicationsCount,
      icon: FileText,
      href: "/applications",
      color: "text-accent",
      bgColor: "bg-accent/10",
      badge: stats.pendingApplications > 0 ? `${stats.pendingApplications} pending` : undefined,
    },
    {
      title: "Active Loans",
      value: stats.activeLoansCount,
      icon: CircleDollarSign,
      href: "/loans",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Collaterals",
      value: stats.collateralCount,
      icon: Shield,
      href: "/collateral",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Customers",
      value: stats.customersCount,
      icon: Users,
      href: "/customers",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to 1Fi Loan Management System. Monitor your lending operations at a glance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 stagger-children">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block group">
            <Card className="border hover:border-primary/50 transition-colors duration-200 hover-lift h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.badge}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-heading font-bold animate-count-up">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    {stat.title}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Total Disbursed */}
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Total Disbursed
            </CardTitle>
            <CardDescription>Total loan amount disbursed across all loans</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-heading font-bold text-success">
              {formatCurrency(stats.totalDisbursed)}
            </p>
          </CardContent>
        </Card>

        {/* Total Collateral Value */}
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-info" />
              Pledged Collateral Value
            </CardTitle>
            <CardDescription>Current market value of all pledged mutual funds</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-heading font-bold text-info">
              {formatCurrency(stats.totalCollateralValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 space-y-4">
            <Link href="/applications/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-colors press-scale">
                <FileText className="h-5 w-5" />
                <span>New Application</span>
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-accent hover:text-accent-foreground transition-colors press-scale">
                <Package className="h-5 w-5" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link href="/customers">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-warning hover:text-warning-foreground transition-colors press-scale">
                <Users className="h-5 w-5" />
                <span>Customer Onboarding</span>
              </Button>
            </Link>
            <Link href="/collateral">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-info hover:text-info-foreground transition-colors press-scale">
                <Shield className="h-5 w-5" />
                <span>View Collaterals</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started (shown when no data) */}
      {stats.productsCount === 0 && (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Get Started</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                  Your LMS is ready! Start by creating loan products, then onboard customers and process applications.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Link href="/products">
                  <Button className="press-scale">
                    <Package className="h-4 w-4 mr-2" />
                    Create Loan Product
                  </Button>
                </Link>
                <Link href="/customers">
                  <Button variant="outline" className="press-scale">
                    <Users className="h-4 w-4 mr-2" />
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
