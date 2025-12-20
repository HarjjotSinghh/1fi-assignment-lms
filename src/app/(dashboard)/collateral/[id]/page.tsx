import { db } from "@/db";
import { collaterals, customers, loans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiShieldLine,
  RiUserLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

async function getCollateralDetails(id: string) {
  try {
    const [collateral] = await db
      .select({
        id: collaterals.id,
        fundName: collaterals.fundName,
        amcName: collaterals.amcName,
        folioNumber: collaterals.folioNumber,
        schemeCode: collaterals.schemeCode,
        schemeName: collaterals.schemeName,
        schemeType: collaterals.schemeType,
        units: collaterals.units,
        purchaseNav: collaterals.purchaseNav,
        currentNav: collaterals.currentNav,
        purchaseValue: collaterals.purchaseValue,
        currentValue: collaterals.currentValue,
        pledgeStatus: collaterals.pledgeStatus,
        pledgedAt: collaterals.pledgedAt,
        releasedAt: collaterals.releasedAt,
        lienMarkedAt: collaterals.lienMarkedAt,
        lienReferenceNumber: collaterals.lienReferenceNumber,
        lastValuationAt: collaterals.lastValuationAt,
        createdAt: collaterals.createdAt,
        customerId: collaterals.customerId,
        loanId: collaterals.loanId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerEmail: customers.email,
        loanNumber: loans.loanNumber,
        loanStatus: loans.status,
      })
      .from(collaterals)
      .leftJoin(customers, eq(collaterals.customerId, customers.id))
      .leftJoin(loans, eq(collaterals.loanId, loans.id))
      .where(eq(collaterals.id, id));

    return collateral;
  } catch (error) {
    return null;
  }
}

type CollateralDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollateralDetailPage({ params }: CollateralDetailPageProps) {
  const { id } = await params;
  const collateral = await getCollateralDetails(id);

  if (!collateral) {
    notFound();
  }

  const change = collateral.currentValue - collateral.purchaseValue;
  const changePercent = collateral.purchaseValue
    ? (change / collateral.purchaseValue) * 100
    : 0;
  const isPositive = change >= 0;

  const schemeTypeColors: Record<string, string> = {
    EQUITY: "bg-primary/10 text-primary border-primary/20",
    DEBT: "bg-info/10 text-info border-info/20",
    HYBRID: "bg-accent/10 text-accent border-accent/20",
    LIQUID: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/collateral">
            <Button variant="ghost" size="icon" className="rounded-none">
              <RiArrowLeftLine className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {collateral.schemeName}
              </h1>
              <Badge className={getStatusColor(collateral.pledgeStatus)}>
                {collateral.pledgeStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {collateral.amcName} • Folio: {collateral.folioNumber}
            </p>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-primary/10">
                <RiMoneyDollarCircleLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-xl font-semibold">{formatCurrency(collateral.currentValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-none ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                {isPositive ? (
                  <RiArrowUpLine className="h-5 w-5 text-success" />
                ) : (
                  <RiArrowDownLine className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unrealized Gain/Loss</p>
                <p className={`text-xl font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? "+" : ""}{formatCurrency(Math.abs(change))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-accent/10">
                <RiLineChartLine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current NAV</p>
                <p className="text-xl font-semibold">₹{collateral.currentNav.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-none ${schemeTypeColors[collateral.schemeType] || "bg-muted"}`}>
                <RiShieldLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheme Type</p>
                <p className="text-xl font-semibold">{collateral.schemeType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Details Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Fund Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Fund Details</CardTitle>
            <CardDescription>Complete mutual fund information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fund Name</span>
                  <span className="text-right">{collateral.fundName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AMC</span>
                  <span>{collateral.amcName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Folio Number</span>
                  <span className="font-mono">{collateral.folioNumber}</span>
                </div>
                {collateral.schemeCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scheme Code</span>
                    <span className="font-mono">{collateral.schemeCode}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Units</span>
                  <span className="font-mono">
                    {collateral.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Purchase NAV</span>
                  <span className="font-mono">₹{collateral.purchaseNav.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current NAV</span>
                  <span className="font-mono">₹{collateral.currentNav.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Purchase Value</span>
                  <span className="font-mono">{formatCurrency(collateral.purchaseValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Value</span>
                  <span className="font-mono font-medium">{formatCurrency(collateral.currentValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Return</span>
                  <span className={`font-mono ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Last Valuation</p>
              <p className="text-sm">{formatDate(collateral.lastValuationAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pledge Details & Customer */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <RiUserLine className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">
                  {collateral.customerFirstName} {collateral.customerLastName}
                </p>
                <p className="text-sm text-muted-foreground">{collateral.customerEmail}</p>
              </div>
              <Link href={`/customers/${collateral.customerId}`}>
                <Button variant="outline" size="sm" className="w-full rounded-none">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pledge Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <RiShieldLine className="h-4 w-4" />
                Pledge Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusColor(collateral.pledgeStatus)}>
                  {collateral.pledgeStatus}
                </Badge>
              </div>
              {collateral.pledgedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pledged On</span>
                  <span>{formatDate(collateral.pledgedAt)}</span>
                </div>
              )}
              {collateral.releasedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Released On</span>
                  <span>{formatDate(collateral.releasedAt)}</span>
                </div>
              )}
              {collateral.lienReferenceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lien Ref</span>
                  <span className="font-mono">{collateral.lienReferenceNumber}</span>
                </div>
              )}
              {collateral.lienMarkedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lien Marked</span>
                  <span>{formatDate(collateral.lienMarkedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Loan */}
          {collateral.loanId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RiMoneyDollarCircleLine className="h-4 w-4" />
                  Linked Loan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loan Number</span>
                  <span className="font-mono text-xs">
                    {collateral.loanNumber?.slice(0, 16)}...
                  </span>
                </div>
                {collateral.loanStatus && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(collateral.loanStatus)}>
                      {collateral.loanStatus}
                    </Badge>
                  </div>
                )}
                <Link href={`/loans/${collateral.loanId}`}>
                  <Button variant="outline" size="sm" className="w-full rounded-none">
                    View Loan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
