import { db } from "@/db";
import { loanApplications, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine,
  RiFileListLine,
  RiFilter3Line,
  RiMore2Line,
  RiSearchLine,
  RiTimeLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { buildQueryString, getPaginationItems, getStringParam, type SearchParams } from "@/lib/pagination";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { ServerRoleGate } from "@/components/auth/role-gate";
import { auth } from "@/lib/auth";

async function getApplications() {
  try {
    const applications = await db
      .select({
        id: loanApplications.id,
        applicationNumber: loanApplications.applicationNumber,
        requestedAmount: loanApplications.requestedAmount,
        approvedAmount: loanApplications.approvedAmount,
        tenure: loanApplications.tenure,
        status: loanApplications.status,
        source: loanApplications.source,
        createdAt: loanApplications.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerEmail: customers.email,
        productName: loanProducts.name,
      })
      .from(loanApplications)
      .leftJoin(customers, eq(loanApplications.customerId, customers.id))
      .leftJoin(loanProducts, eq(loanApplications.productId, loanProducts.id))
      .orderBy(desc(loanApplications.createdAt));

    return applications;
  } catch (error) {
    return [];
  }
}

const statusIcons: Record<string, React.ReactNode> = {
  DRAFT: <RiTimeLine className="h-3.5 w-3.5" />,
  SUBMITTED: <RiTimeLine className="h-3.5 w-3.5" />,
  UNDER_REVIEW: <RiTimeLine className="h-3.5 w-3.5" />,
  APPROVED: <RiCheckLine className="h-3.5 w-3.5" />,
  REJECTED: <RiCloseLine className="h-3.5 w-3.5" />,
  DISBURSED: <RiCheckLine className="h-3.5 w-3.5" />,
  CANCELLED: <RiCloseLine className="h-3.5 w-3.5" />,
};

type ApplicationsPageProps = {
  searchParams?: SearchParams;
};

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const session = await auth();
  const userRole = session?.user?.role;
  const applications = await getApplications();
  const searchQuery = (getStringParam(searchParams?.q) ?? "").trim();
  const statusFilter = getStringParam(searchParams?.status) ?? "all";
  const sortBy = getStringParam(searchParams?.sort) ?? "recent";
  const pageParam = Number(getStringParam(searchParams?.page));
  const currentPageParam = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const normalizedQuery = searchQuery.toLowerCase();
  const pageSize = 8;

  const filteredApplications = applications.filter((app) => {
    const searchable = [
      app.applicationNumber,
      app.customerFirstName,
      app.customerLastName,
      app.customerEmail,
      app.productName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStatus = (() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "pending") {
        return ["SUBMITTED", "UNDER_REVIEW"].includes(app.status);
      }
      if (statusFilter === "approved") {
        return app.status === "APPROVED";
      }
      if (statusFilter === "disbursed") {
        return app.status === "DISBURSED";
      }
      return app.status === statusFilter.toUpperCase();
    })();

    return matchesQuery && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === "amount") {
      return (b.requestedAmount ?? 0) - (a.requestedAmount ?? 0);
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pageSize));
  const currentPage = Math.min(currentPageParam, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedApplications = sortedApplications.slice(startIndex, startIndex + pageSize);
  const pageItems = getPaginationItems(currentPage, totalPages);
  const startItem = sortedApplications.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + pageSize, sortedApplications.length);

  const stats = {
    total: applications.length,
    pending: applications.filter((app) => ["SUBMITTED", "UNDER_REVIEW"].includes(app.status)).length,
    approved: applications.filter((app) => app.status === "APPROVED").length,
    disbursed: applications.filter((app) => app.status === "DISBURSED").length,
  };

  const totalRequested = applications.reduce(
    (sum, app) => sum + (app.requestedAmount ?? 0),
    0
  );
  const avgTicket = stats.total ? totalRequested / stats.total : 0;
  const conversionRate = stats.total ? Math.round((stats.disbursed / stats.total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-none border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
                Origination pipeline
              </Badge>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Loan Applications</h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Track submissions, approvals, and disbursals across every product line.
              </p>
            </div>
            <ServerRoleGate userRole={userRole} permission="applications:create">
              <Link href="/applications/new">
                <Button className="gap-2 rounded-none">
                  <RiAddLine className="h-4 w-4" />
                  New application
                </Button>
              </Link>
            </ServerRoleGate>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {[
              { label: "Total applications", value: stats.total },
              { label: "Pending review", value: stats.pending },
              { label: "Approved", value: stats.approved },
              { label: "Disbursed", value: stats.disbursed },
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
                    placeholder="Search applications..."
                    className="pl-9 rounded-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ButtonGroup className="rounded-none border border-input bg-background/80 p-1">
                    {[
                      { label: "All", value: "all" },
                      { label: "Pending", value: "pending" },
                      { label: "Approved", value: "approved" },
                      { label: "Disbursed", value: "disbursed" },
                    ].map((option) => {
                      const isActive = statusFilter === option.value;
                      return (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          asChild
                          aria-pressed={isActive}
                          className={`rounded-none ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          <Link
                            href={`/applications${buildQueryString(searchParams, {
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
                    className="h-9 w-[160px] rounded-none border border-input bg-background/80 px-3 text-sm"
                  >
                    <option value="recent">Most recent</option>
                    <option value="amount">Highest amount</option>
                    <option value="status">Status</option>
                  </select>
                  <Button type="submit" variant="outline" size="icon" className="rounded-none">
                    <RiFilter3Line className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pipeline conversion</CardTitle>
            <CardDescription>Disbursed vs total applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conversion rate</span>
              <span className="font-medium">{conversionRate}%</span>
            </div>
            <Progress value={conversionRate} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg ticket size</span>
              <span className="font-medium">{formatCurrency(avgTicket)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {applications.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <RiFileListLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Applications Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Create your first loan application to get started. You can also receive applications via API.
                </p>
              </div>
              <ServerRoleGate userRole={userRole} permission="applications:create">
                <Link href="/applications/new">
                  <Button className="press-scale rounded-none">
                    <RiAddLine className="h-4 w-4 mr-2" />
                    Create application
                  </Button>
                </Link>
              </ServerRoleGate>
            </div>
          </CardContent>
        </Card>
      ) : sortedApplications.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <RiSearchLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No matching applications</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Try a different search keyword or reset the status filters.
                </p>
              </div>
              <Button variant="outline" className="rounded-none" asChild>
                <Link href="/applications">Clear filters</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Application #</TableHead>
                  <TableHead className="font-medium">Customer</TableHead>
                  <TableHead className="font-medium">Product</TableHead>
                  <TableHead className="font-medium text-right">Amount</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Source</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="stagger-children">
                {paginatedApplications.map((app) => (
                  <TableRow key={app.id} className="group">
                    <TableCell className="font-mono text-sm">
                      {app.applicationNumber.slice(0, 16)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {app.customerFirstName} {app.customerLastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{app.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{app.productName || "-"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(app.requestedAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1.5 ${getStatusColor(app.status)}`}>
                        {statusIcons[app.status]}
                        {app.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {app.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(app.createdAt)}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/applications/${app.id}`}>
                              <RiEyeLine className="h-4 w-4 mr-2" /> View details
                            </Link>
                          </DropdownMenuItem>
                          {["SUBMITTED", "UNDER_REVIEW"].includes(app.status) && (
                            <>
                              <ServerRoleGate userRole={userRole} permission="applications:approve">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-success focus:text-success">
                                  <RiCheckLine className="h-4 w-4 mr-2" /> Approve
                                </DropdownMenuItem>
                              </ServerRoleGate>
                              <ServerRoleGate userRole={userRole} permission="applications:reject">
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <RiCloseLine className="h-4 w-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              </ServerRoleGate>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {startItem}-{endItem} of {sortedApplications.length} applications
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/applications${buildQueryString(searchParams, {
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
                            href={`/applications${buildQueryString(searchParams, { page: item })}`}
                            isActive={item === currentPage}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href={`/applications${buildQueryString(searchParams, {
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
