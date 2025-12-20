import { db } from "@/db";
import { collaterals, customers, loans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiEyeLine,
  RiMore2Line,
  RiPieChartLine,
  RiSearchLine,
  RiShieldLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const totalPledged = allCollaterals.filter((collateral) => collateral.pledgeStatus === "PLEDGED").length;
  const totalValue = allCollaterals.reduce((sum, collateral) => sum + collateral.currentValue, 0);
  const totalUnits = allCollaterals.reduce((sum, collateral) => sum + collateral.units, 0);
  const totalPurchase = allCollaterals.reduce((sum, collateral) => sum + collateral.purchaseValue, 0);
  const gainLoss = totalValue - totalPurchase;

  const schemeTypeColors: Record<string, string> = {
    EQUITY: "bg-primary/10 text-primary border-primary/20",
    DEBT: "bg-info/10 text-info border-info/20",
    HYBRID: "bg-accent/10 text-accent border-accent/20",
    LIQUID: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative space-y-6">
          <div className="space-y-2">
            <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
              Collateral vault
            </Badge>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Collateral Management</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Track pledged mutual fund units, live NAV updates, and collateral coverage ratios.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Pledged collaterals", value: totalPledged },
              { label: "Total current value", value: formatCurrency(totalValue) },
              { label: "Total units", value: totalUnits.toLocaleString("en-IN", { maximumFractionDigits: 2 }) },
              { label: "Unrealized gain/loss", value: formatCurrency(Math.abs(gainLoss)), delta: gainLoss },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/80">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {stat.delta !== undefined ? (
                      stat.delta >= 0 ? (
                        <RiArrowUpLine className="h-4 w-4 text-success" />
                      ) : (
                        <RiArrowDownLine className="h-4 w-4 text-destructive" />
                      )
                    ) : null}
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Card className="border bg-card/80">
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search collaterals..." className="pl-9 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="pledged">
              <SelectTrigger className="h-9 w-[180px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pledged">Pledged only</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="liquidated">Liquidated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {allCollaterals.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
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
        <Card className="border bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All Collaterals</CardTitle>
            <CardDescription>Live valuation snapshots across pledged units.</CardDescription>
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
                  const changePercent = collateral.purchaseValue
                    ? (change / collateral.purchaseValue) * 100
                    : 0;

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
                        INR {collateral.currentNav.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-mono font-medium">
                            {formatCurrency(collateral.currentValue)}
                          </p>
                          <p
                            className={`text-xs font-mono ${
                              change >= 0 ? "text-success" : "text-destructive"
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
                              <RiEyeLine className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RiPieChartLine className="h-4 w-4 mr-2" /> NAV history
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
