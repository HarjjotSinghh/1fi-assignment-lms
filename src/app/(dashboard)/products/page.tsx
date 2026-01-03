import { db } from "@/db";
import { loanProducts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFileChartLine,
  RiMoneyDollarCircleLine,
  RiMore2Line,
  RiPercentLine,
  RiSearchLine,
  RiStackLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ProductFormDialog } from "./product-form-dialog";
import { ServerRoleGate } from "@/components/auth/role-gate";
import { auth } from "@/lib/auth";

async function getProducts() {
  try {
    return await db.select().from(loanProducts).orderBy(desc(loanProducts.createdAt));
  } catch (error) {
    return [];
  }
}

type ProductsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userRole = session?.user?.role;
  const products = await getProducts();

  const searchQuery = (getStringParam(searchParams?.q) ?? "").trim();
  const statusFilter = getStringParam(searchParams?.status) ?? "all";
  const sortBy = getStringParam(searchParams?.sort) ?? "recent";
  const pageParam = Number(getStringParam(searchParams?.page));

  const currentPageParam = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const normalizedQuery = searchQuery.toLowerCase();
  const pageSize = 6;

  const filteredProducts = products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      [product.name, product.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? product.isActive : !product.isActive);

    return matchesQuery && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "rate") {
      return b.interestRatePercent - a.interestRatePercent;
    }
    if (sortBy === "ltv") {
      return (b.maxLtvPercent ?? 0) - (a.maxLtvPercent ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const currentPage = Math.min(currentPageParam, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + pageSize);
  const pageItems = getPaginationItems(currentPage, totalPages);
  const startItem = sortedProducts.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + pageSize, sortedProducts.length);

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const avgInterestRate = totalProducts
    ? products.reduce((sum, product) => sum + product.interestRatePercent, 0) / totalProducts
    : 0;
  const avgLtv = totalProducts
    ? products.reduce((sum, product) => sum + (product.maxLtvPercent ?? 0), 0) / totalProducts
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-none border bg-gradient-to-br from-primary/5 via-background to-accent/10 p-6 md:p-8 dark:from-primary/10 dark:via-background dark:to-accent/5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
                Product Studio
              </Badge>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Loan Products</h1>
              <p className="text-muted-foreground max-w-2xl text-sm">
                Configure interest bands, tenure rules, and collateral coverage for every lending product.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ServerRoleGate userRole={userRole} permission="analytics:export">
                <Button variant="outline" className="rounded-none gap-2">
                  <RiFileChartLine className="h-4 w-4" />
                  Export
                </Button>
              </ServerRoleGate>
              <ServerRoleGate userRole={userRole} permission="products:create">
                <ProductFormDialog />
              </ServerRoleGate>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {[
              { label: "Total products", value: totalProducts },
              { label: "Active products", value: activeProducts },
              { label: "Avg interest rate", value: formatPercent(avgInterestRate) },
              { label: "Avg max LTV", value: formatPercent(avgLtv) },
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form method="get" className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="status" value={statusFilter} />
              <div className="relative w-full lg:max-w-xs">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search products..."
                  className="pl-9 rounded-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonGroup className="rounded-none border border-input bg-background/80 p-1">
                  {[
                    { label: "All", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
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
                          href={`/products${buildQueryString(searchParams, {
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
                  <option value="rate">Highest rate</option>
                  <option value="ltv">Highest LTV</option>
                </select>
                <Button type="submit" variant="outline" size="icon" className="rounded-none">
                  <RiSearchLine className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <RiStackLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Products Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Create your first loan product to start accepting applications. Define interest rates, tenure, and LTV parameters.
                </p>
              </div>
              <ServerRoleGate userRole={userRole} permission="products:create">
                <ProductFormDialog />
              </ServerRoleGate>
            </div>
          </CardContent>
        </Card>
      ) : sortedProducts.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <RiSearchLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No matching products</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Try adjusting your search or filters to find the products you need.
                </p>
              </div>
              <Button variant="outline" className="rounded-none" asChild>
                <Link href="/products">Clear filters</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {startItem}-{endItem} of {sortedProducts.length} products
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {paginatedProducts.map((product) => (
              <Card key={product.id} className="border bg-card/90">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-lg">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <RiMore2Line className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}`}>
                              <RiEyeLine className="h-4 w-4 mr-2" /> View details
                            </Link>
                          </DropdownMenuItem>
                          <ServerRoleGate userRole={userRole} permission="products:edit">
                            <DropdownMenuItem>
                              <RiEditLine className="h-4 w-4 mr-2" /> Edit product
                            </DropdownMenuItem>
                          </ServerRoleGate>
                          <ServerRoleGate userRole={userRole} permission="products:delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <RiDeleteBinLine className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </ServerRoleGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-none bg-primary/10">
                      <RiMoneyDollarCircleLine className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Loan amount</p>
                      <p className="font-medium font-mono">
                        {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-none bg-accent/10">
                      <RiPercentLine className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Interest rate</p>
                      <p className="font-medium font-mono">{formatPercent(product.interestRatePercent)} p.a.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-none bg-info/10">
                      <RiCalendarLine className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tenure range</p>
                      <p className="font-medium font-mono">
                        {product.minTenureMonths} - {product.maxTenureMonths} months
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Max LTV</span>
                    <span className="font-mono font-medium">{formatPercent(product.maxLtvPercent ?? 50)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`/products${buildQueryString(searchParams, {
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
                        href={`/products${buildQueryString(searchParams, { page: item })}`}
                        isActive={item === currentPage}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href={`/products${buildQueryString(searchParams, {
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
      )}
    </div>
  );
}
