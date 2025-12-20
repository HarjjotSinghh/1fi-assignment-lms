import { db } from "@/db";
import { collaterals, customers, loans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
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
import { ButtonGroup } from "@/components/ui/button-group";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { buildQueryString, getPaginationItems, getStringParam, type SearchParams } from "@/lib/pagination";
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
        createdAt: collaterals.createdAt,
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

type CollateralPageProps = {
  searchParams?: SearchParams;
};

export default async function CollateralPage({ searchParams }: CollateralPageProps) {
  const allCollaterals = await getCollaterals();
  const searchQuery = (getStringParam(searchParams?.q) ?? "").trim();
  const statusFilter = getStringParam(searchParams?.status) ?? "all";
  const typeFilter = getStringParam(searchParams?.type) ?? "all";
  const sortBy = getStringParam(searchParams?.sort) ?? "recent";
  const pageParam = Number(getStringParam(searchParams?.page));
  const currentPageParam = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const normalizedQuery = searchQuery.toLowerCase();
  const pageSize = 8;

  const filteredCollaterals = allCollaterals.filter((collateral) => {
    const searchable = [
      collateral.schemeName,
      collateral.fundName,
      collateral.amcName,
      collateral.folioNumber,
      collateral.customerFirstName,
      collateral.customerLastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      collateral.pledgeStatus === statusFilter.toUpperCase();
    const matchesType =
      typeFilter === "all" || collateral.schemeType === typeFilter.toUpperCase();
    return matchesQuery && matchesStatus && matchesType;
  });

  const sortedCollaterals = [...filteredCollaterals].sort((a, b) => {
    if (sortBy === "value") {
      return b.currentValue - a.currentValue;
    }
    if (sortBy === "change") {
      const changeA = a.currentValue - a.purchaseValue;
      const changeB = b.currentValue - b.purchaseValue;
      return changeB - changeA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedCollaterals.length / pageSize));
  const currentPage = Math.min(currentPageParam, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCollaterals = sortedCollaterals.slice(startIndex, startIndex + pageSize);
  const pageItems = getPaginationItems(currentPage, totalPages);
  const startItem = sortedCollaterals.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + pageSize, sortedCollaterals.length);

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
    UNKNOWN: "bg-muted text-muted-foreground",
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
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form method="get" className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="status" value={statusFilter} />
              <input type="hidden" name="type" value={typeFilter} />
              <div className="relative w-full lg:max-w-xs">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search collaterals..."
                  className="pl-9 rounded-xl"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonGroup className="rounded-xl border border-input bg-background/80 p-1">
                  {[
                    { label: "All", value: "all" },
                    { label: "Pledged", value: "pledged" },
                    { label: "Pending", value: "pending" },
                    { label: "Released", value: "released" },
                    { label: "Liquidated", value: "liquidated" },
                  ].map((option) => {
                    const isActive = statusFilter === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant="ghost"
                        size="sm"
                        asChild
                        aria-pressed={isActive}
                        className={`rounded-lg ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                      >
                        <Link
                          href={`/collateral${buildQueryString(searchParams, {
                            status: option.value,
                            page: 1,
                          })}`}
                        >
                          {option.label}
                        </Link>
                      </Button>
                    );
                  })}
                </ButtonGroup>
                <select
                  name="type"
                  defaultValue={typeFilter}
                  className="h-9 w-[150px] rounded-xl border border-input bg-background/80 px-3 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="liquid">Liquid</option>
                </select>
                <select
                  name="sort"
                  defaultValue={sortBy}
                  className="h-9 w-[160px] rounded-xl border border-input bg-background/80 px-3 text-sm"
                >
                  <option value="recent">Most recent</option>
                  <option value="value">Highest value</option>
                  <option value="change">Largest change</option>
                </select>
                <Button type="submit" variant="outline" size="icon" className="rounded-xl">
                  <RiSearchLine className="h-4 w-4" />
                </Button>
              </div>
            </form>
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
      ) : sortedCollaterals.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiSearchLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No matching collaterals</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Update your search or filters to locate specific pledged assets.
                </p>
              </div>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href="/collateral">Clear filters</Link>
              </Button>
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
              <TableBody className="stagger-children">
                {paginatedCollaterals.map((collateral) => {
                  const change = collateral.currentValue - collateral.purchaseValue;
                  const changePercent = collateral.purchaseValue
                    ? (change / collateral.purchaseValue) * 100
                    : 0;
                  const schemeClass = schemeTypeColors[collateral.schemeType] ?? schemeTypeColors.UNKNOWN;

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
                        <Badge className={`${schemeClass} text-xs`}>
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
            <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {startItem}-{endItem} of {sortedCollaterals.length} collaterals
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/collateral${buildQueryString(searchParams, {
                          page: Math.max(1, currentPage - 1),
                        })}`}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {pageItems.map((item, index) =>
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href={`/collateral${buildQueryString(searchParams, { page: item })}`}
                            isActive={item === currentPage}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href={`/collateral${buildQueryString(searchParams, {
                          page: Math.min(totalPages, currentPage + 1),
                        })}`}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
