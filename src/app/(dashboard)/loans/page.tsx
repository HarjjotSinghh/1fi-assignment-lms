import { db } from "@/db";
import { loans, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  RiAlertLine,
  RiCalendarLine,
  RiEyeLine,
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiMore2Line,
  RiSearchLine,
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
import { Progress } from "@/components/ui/progress";
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
import { formatCurrency, formatDate, formatPercent, getStatusColor } from "@/lib/utils";

async function getLoans() {
  try {
    const allLoans = await db
      .select({
        id: loans.id,
        loanNumber: loans.loanNumber,
        principalAmount: loans.principalAmount,
        interestRate: loans.interestRate,
        tenure: loans.tenure,
        emiAmount: loans.emiAmount,
        outstandingPrincipal: loans.outstandingPrincipal,
        totalOutstanding: loans.totalOutstanding,
        disbursedAt: loans.disbursedAt,
        maturityDate: loans.maturityDate,
        status: loans.status,
        currentLtv: loans.currentLtv,
        createdAt: loans.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerEmail: customers.email,
        productName: loanProducts.name,
      })
      .from(loans)
      .leftJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
      .orderBy(desc(loans.createdAt));

    return allLoans;
  } catch (error) {
    return [];
  }
}

type LoansPageProps = {
  searchParams?: SearchParams;
};

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const allLoans = await getLoans();
  const searchQuery = (getStringParam(searchParams?.q) ?? "").trim();
  const statusFilter = getStringParam(searchParams?.status) ?? "all";
  const sortBy = getStringParam(searchParams?.sort) ?? "recent";
  const pageParam = Number(getStringParam(searchParams?.page));
  const currentPageParam = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const normalizedQuery = searchQuery.toLowerCase();
  const pageSize = 8;

  const filteredLoans = allLoans.filter((loan) => {
    const searchable = [
      loan.loanNumber,
      loan.customerFirstName,
      loan.customerLastName,
      loan.customerEmail,
      loan.productName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStatus = (() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return loan.status === "ACTIVE";
      if (statusFilter === "closed") return loan.status === "CLOSED";
      if (statusFilter === "defaulted") {
        return ["DEFAULT", "NPA", "WRITTEN_OFF"].includes(loan.status);
      }
      return loan.status === statusFilter.toUpperCase();
    })();
    return matchesQuery && matchesStatus;
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    if (sortBy === "outstanding") {
      return (b.totalOutstanding ?? 0) - (a.totalOutstanding ?? 0);
    }
    if (sortBy === "ltv") {
      return (b.currentLtv ?? 0) - (a.currentLtv ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedLoans.length / pageSize));
  const currentPage = Math.min(currentPageParam, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLoans = sortedLoans.slice(startIndex, startIndex + pageSize);
  const pageItems = getPaginationItems(currentPage, totalPages);
  const startItem = sortedLoans.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + pageSize, sortedLoans.length);

  const totalActive = allLoans.filter((loan) => loan.status === "ACTIVE").length;
  const totalOutstanding = allLoans.reduce(
    (sum, loan) => sum + (loan.totalOutstanding ?? 0),
    0
  );
  const avgLtv = allLoans.length
    ? allLoans.reduce((sum, loan) => sum + (loan.currentLtv ?? 0), 0) / allLoans.length
    : 0;
  const atRisk = allLoans.filter((loan) => (loan.currentLtv ?? 0) > 55).length;
  const riskRate = totalActive ? Math.round((atRisk / totalActive) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
                Portfolio health
              </Badge>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Active Loans</h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Monitor repayment progress, LTV coverage, and loan performance in real time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl gap-2">
                <RiLineChartLine className="h-4 w-4" />
                Portfolio report
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {[
              { label: "Active loans", value: totalActive },
              { label: "Total outstanding", value: formatCurrency(totalOutstanding) },
              { label: "Average LTV", value: formatPercent(avgLtv) },
              { label: "At risk loans", value: atRisk },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/80">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="border bg-card/80">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <form method="get" className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                <input type="hidden" name="page" value="1" />
                <input type="hidden" name="status" value={statusFilter} />
                <div className="relative w-full lg:max-w-xs">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search loans..."
                    className="pl-9 rounded-xl"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ButtonGroup className="rounded-xl border border-input bg-background/80 p-1">
                    {[
                      { label: "All", value: "all" },
                      { label: "Active", value: "active" },
                      { label: "Closed", value: "closed" },
                      { label: "Defaulted", value: "defaulted" },
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
                            href={`/loans${buildQueryString(searchParams, {
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
                    name="sort"
                    defaultValue={sortBy}
                    className="h-9 w-[160px] rounded-xl border border-input bg-background/80 px-3 text-sm"
                  >
                    <option value="recent">Most recent</option>
                    <option value="outstanding">Highest outstanding</option>
                    <option value="ltv">Highest LTV</option>
                  </select>
                  <Button type="submit" variant="outline" size="icon" className="rounded-xl">
                    <RiSearchLine className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Risk monitoring</CardTitle>
            <CardDescription>Loans above 55% LTV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Risk exposure</span>
              <span className="font-medium">{riskRate}%</span>
            </div>
            <Progress value={riskRate} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RiAlertLine className="h-4 w-4 text-warning" />
              Review collateral top-ups for at-risk accounts.
            </div>
          </CardContent>
        </Card>
      </div>

      {allLoans.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiMoneyDollarCircleLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Active Loans Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Loans will appear here once applications are approved and disbursed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : sortedLoans.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiSearchLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No matching loans</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Adjust your filters or search by customer, product, or loan number.
                </p>
              </div>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href="/loans">Clear filters</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All Loans</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Loan #</TableHead>
                  <TableHead className="font-medium">Customer</TableHead>
                  <TableHead className="font-medium">Product</TableHead>
                  <TableHead className="font-medium text-right">Principal</TableHead>
                  <TableHead className="font-medium text-right">Outstanding</TableHead>
                  <TableHead className="font-medium">LTV</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Maturity</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="stagger-children">
                {paginatedLoans.map((loan) => {
                  const ltvPercent = loan.currentLtv ?? 0;
                  const isAtRisk = ltvPercent > 55;

                  return (
                    <TableRow key={loan.id} className="group">
                      <TableCell className="font-mono text-sm">
                        {loan.loanNumber.slice(0, 16)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {loan.customerFirstName} {loan.customerLastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{loan.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{loan.productName || "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(loan.principalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(loan.totalOutstanding ?? 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={ltvPercent} className="w-16 h-1.5" />
                          <span className={`text-xs font-mono ${isAtRisk ? "text-warning" : ""}`}>
                            {formatPercent(ltvPercent)}
                          </span>
                          {isAtRisk && <RiAlertLine className="h-3.5 w-3.5 text-warning" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(loan.maturityDate)}
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
                              <RiCalendarLine className="h-4 w-4 mr-2" /> EMI schedule
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
                Showing {startItem}-{endItem} of {sortedLoans.length} loans
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/loans${buildQueryString(searchParams, {
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
                            href={`/loans${buildQueryString(searchParams, { page: item })}`}
                            isActive={item === currentPage}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href={`/loans${buildQueryString(searchParams, {
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
