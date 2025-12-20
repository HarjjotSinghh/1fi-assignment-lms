import { db } from "@/db";
import { collaterals, customers, loans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  RiShieldLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiEyeLine,
  RiMore2Line,
  RiPieChartLine,
} from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getStatusColor } from "@/lib/utils";

async function getCollaterals() {
  try {
    const allCollaterals = await db
      .select({
        id: collaterals.id,
        fundName: collaterals.fundName,
        amcName: collaterals.amcName,
        folioNumber: collaterals.folioNumber,
        schemeName: collaterals.schemeName,
        schemeType: collaterals.schemeType,
        units: collaterals.units,
        purchaseNav: collaterals.purchaseNav,
        currentNav: collaterals.currentNav,
        purchaseValue: collaterals.purchaseValue,
        currentValue: collaterals.currentValue,
        pledgeStatus: collaterals.pledgeStatus,
        pledgedAt: collaterals.pledgedAt,
        lastValuationAt: collaterals.lastValuationAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        loanNumber: loans.loanNumber,
      })
      .from(collaterals)
      .leftJoin(customers, eq(collaterals.customerId, customers.id))
      .leftJoin(loans, eq(collaterals.loanId, loans.id))
      .orderBy(desc(collaterals.createdAt));

    return allCollaterals;
  } catch (error) {
    return [];
  }
}

export default async function CollateralPage() {
  const allCollaterals = await getCollaterals();

  const stats = {
    totalPledged: allCollaterals.filter((c) => c.pledgeStatus === "PLEDGED").length,
    totalValue: allCollaterals.reduce((sum, c) => sum + c.currentValue, 0),
    totalUnits: allCollaterals.reduce((sum, c) => sum + c.units, 0),
    gainLoss:
      allCollaterals.reduce((sum, c) => sum + c.currentValue, 0) -
      allCollaterals.reduce((sum, c) => sum + c.purchaseValue, 0),
  };

  const schemeTypeColors: Record<string, string> = {
    EQUITY: "bg-primary/10 text-primary border-primary/20",
    DEBT: "bg-info/10 text-info border-info/20",
    HYBRID: "bg-accent/10 text-accent border-accent/20",
    LIQUID: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Collateral Management</h1>
        <p className="text-muted-foreground mt-1">
          Track pledged mutual fund units, current valuations, and manage collateral across all loans.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Pledged Collaterals</p>
            <p className="text-2xl font-heading font-bold mt-1">{stats.totalPledged}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total Current Value</p>
            <p className="text-2xl font-heading font-bold mt-1 text-primary">
              {formatCurrency(stats.totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="text-2xl font-heading font-bold mt-1">
              {stats.totalUnits.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Unrealized Gain/Loss</p>
            <div className="flex items-center gap-2 mt-1">
              {stats.gainLoss >= 0 ? (
                <RiArrowUpLine className="h-5 w-5 text-primary" />
              ) : (
                <RiArrowDownLine className="h-5 w-5 text-destructive" />
              )}
              <p
                className={`text-2xl font-heading font-bold ${
                  stats.gainLoss >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {formatCurrency(Math.abs(stats.gainLoss))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {allCollaterals.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-primary/10 flex items-center justify-center">
                <RiShieldLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Collaterals Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Collaterals will appear here when mutual fund units are pledged against loans.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All Collaterals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Scheme</TableHead>
                  <TableHead className="font-medium">AMC</TableHead>
                  <TableHead className="font-medium">Customer</TableHead>
                  <TableHead className="font-medium">Type</TableHead>
                  <TableHead className="font-medium text-right">Units</TableHead>
                  <TableHead className="font-medium text-right">Current NAV</TableHead>
                  <TableHead className="font-medium text-right">Value</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCollaterals.map((collateral) => {
                  const change = collateral.currentValue - collateral.purchaseValue;
                  const changePercent = (change / collateral.purchaseValue) * 100;

                  return (
                    <TableRow key={collateral.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">{collateral.schemeName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {collateral.folioNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {collateral.amcName}
                      </TableCell>
                      <TableCell>
                        {collateral.customerFirstName} {collateral.customerLastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${schemeTypeColors[collateral.schemeType]} text-xs`}>
                          {collateral.schemeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {collateral.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{collateral.currentNav.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-mono font-medium">
                            {formatCurrency(collateral.currentValue)}
                          </p>
                          <p
                            className={`text-xs font-mono ${
                              change >= 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {change >= 0 ? "+" : ""}
                            {changePercent.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(collateral.pledgeStatus)}>
                          {collateral.pledgeStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <RiMore2Line className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <RiEyeLine className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RiPieChartLine className="h-4 w-4 mr-2" /> NAV History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
