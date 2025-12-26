import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiEyeLine,
  RiMailLine,
  RiMore2Line,
  RiPhoneLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiUserAddLine,
  RiUserLine,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buildQueryString, getPaginationItems, getStringParam, type SearchParams } from "@/lib/pagination";
import { formatDate, getStatusColor, maskPan, maskAadhaar } from "@/lib/utils";
import { ServerRoleGate } from "@/components/auth/role-gate";
import { auth } from "@/lib/auth";

async function getCustomers() {
  try {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  } catch (error) {
    return [];
  }
}

type CustomersPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CustomersPage(props: CustomersPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userRole = session?.user?.role;
  const allCustomers = await getCustomers();
  const searchQuery = (getStringParam(searchParams?.q) ?? "").trim();
  const statusFilter = getStringParam(searchParams?.status) ?? "all";
  const sortBy = getStringParam(searchParams?.sort) ?? "recent";
  const pageParam = Number(getStringParam(searchParams?.page));
  const currentPageParam = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const normalizedQuery = searchQuery.toLowerCase();
  const pageSize = 8;

  const filteredCustomers = allCustomers.filter((customer) => {
    const searchable = [
      customer.firstName,
      customer.lastName,
      customer.email,
      customer.phone,
      customer.city,
      customer.state,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStatus = (() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "verified") return customer.kycStatus === "VERIFIED";
      if (statusFilter === "pending") {
        return ["PENDING", "IN_PROGRESS"].includes(customer.kycStatus);
      }
      if (statusFilter === "rejected") return customer.kycStatus === "REJECTED";
      return customer.kycStatus === statusFilter.toUpperCase();
    })();
    return matchesQuery && matchesStatus;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
      const nameB = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
      return nameA.localeCompare(nameB);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / pageSize));
  const currentPage = Math.min(currentPageParam, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + pageSize);
  const pageItems = getPaginationItems(currentPage, totalPages);
  const startItem = sortedCustomers.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + pageSize, sortedCustomers.length);

  const stats = {
    total: allCustomers.length,
    verified: allCustomers.filter((customer) => customer.kycStatus === "VERIFIED").length,
    pending: allCustomers.filter((customer) => customer.kycStatus === "PENDING").length,
    rejected: allCustomers.filter((customer) => customer.kycStatus === "REJECTED").length,
  };

  const verifiedRate = stats.total ? Math.round((stats.verified / stats.total) * 100) : 0;

  const kycStatusIcons: Record<string, React.ReactNode> = {
    PENDING: <RiTimeLine className="h-3.5 w-3.5" />,
    IN_PROGRESS: <RiTimeLine className="h-3.5 w-3.5" />,
    VERIFIED: <RiCheckLine className="h-3.5 w-3.5" />,
    REJECTED: <RiCloseLine className="h-3.5 w-3.5" />,
  };

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
                Customer registry
              </Badge>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Manage customer profiles, KYC verification status, and onboarding progress.
              </p>
            </div>
            <Link href="/applications/new">
              <Button className="gap-2 rounded-none">
                <RiUserAddLine className="h-4 w-4" />
                Onboard customer
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {[
              { label: "Total customers", value: stats.total },
              { label: "KYC verified", value: stats.verified },
              { label: "KYC pending", value: stats.pending },
              { label: "Verified rate", value: `${verifiedRate}%` },
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
                  placeholder="Search customers..."
                  className="pl-9 rounded-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonGroup className="rounded-none border border-input bg-background/80 p-1">
                  {[
                    { label: "All", value: "all" },
                    { label: "Verified", value: "verified" },
                    { label: "Pending", value: "pending" },
                    { label: "Rejected", value: "rejected" },
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
                          href={`/customers${buildQueryString(searchParams, {
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
                  <option value="name">Alphabetical</option>
                </select>
                <Button type="submit" variant="outline" size="icon" className="rounded-none">
                  <RiSearchLine className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {allCustomers.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <RiUserLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Customers Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Start by onboarding your first customer. Complete KYC verification to process their loan application.
                </p>
              </div>
              <Link href="/applications/new">
                <Button className="press-scale rounded-none">
                  <RiUserAddLine className="h-4 w-4 mr-2" />
                  Onboard customer
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : sortedCustomers.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <RiSearchLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No matching customers</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Try a different query or reset the KYC filters.
                </p>
              </div>
              <Button variant="outline" className="rounded-none" asChild>
                <Link href="/customers">Clear filters</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All Customers</CardTitle>
            <CardDescription>Verified identities and KYC progress at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Customer</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                  <TableHead className="font-medium">KYC Status</TableHead>
                  <TableHead className="font-medium">Aadhaar</TableHead>
                  <TableHead className="font-medium">PAN</TableHead>
                  <TableHead className="font-medium">Location</TableHead>
                  <TableHead className="font-medium">Joined</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="stagger-children">
                {paginatedCustomers.map((customer) => {
                  const initials = `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase();

                  return (
                    <TableRow key={customer.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {initials || "NA"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.employmentType?.replace("_", " ") || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm flex items-center gap-1.5">
                            <RiMailLine className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </p>
                          <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                            <RiPhoneLine className="h-3 w-3" />
                            {customer.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1.5 ${getStatusColor(customer.kycStatus)}`}>
                          {kycStatusIcons[customer.kycStatus]}
                          {customer.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {customer.aadhaarNumber ? maskAadhaar(customer.aadhaarNumber) : "-"}
                          </span>
                          {customer.aadhaarVerified && (
                            <RiCheckLine className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {customer.panNumber ? maskPan(customer.panNumber) : "-"}
                          </span>
                          {customer.panVerified && (
                            <RiCheckLine className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {customer.city && customer.state
                          ? `${customer.city}, ${customer.state}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(customer.createdAt)}
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
                              <Link href={`/customers/${customer.id}`}>
                                <RiEyeLine className="h-4 w-4 mr-2" /> View profile
                              </Link>
                            </DropdownMenuItem>
                            <ServerRoleGate userRole={userRole} permission="customers:edit">
                              <DropdownMenuItem>
                                <RiEditLine className="h-4 w-4 mr-2" /> Edit customer
                              </DropdownMenuItem>
                            </ServerRoleGate>
                            <ServerRoleGate userRole={userRole} permission="customers:kyc_override">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <RiShieldCheckLine className="h-4 w-4 mr-2" /> KYC override
                              </DropdownMenuItem>
                            </ServerRoleGate>
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
                Showing {startItem}-{endItem} of {sortedCustomers.length} customers
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/customers${buildQueryString(searchParams, {
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
                            href={`/customers${buildQueryString(searchParams, { page: item })}`}
                            isActive={item === currentPage}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href={`/customers${buildQueryString(searchParams, {
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
