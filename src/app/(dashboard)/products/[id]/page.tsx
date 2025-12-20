import { db } from "@/db";
import { loanProducts, loanApplications, loans, customers } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiCheckLine,
  RiEditLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiPercentLine,
  RiShieldLine,
  RiStackLine,
  RiTimeLine,
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
import { formatCurrency, formatDate, formatPercent, getStatusColor } from "@/lib/utils";

async function getProductDetails(id: string) {
  try {
    const [product] = await db
      .select()
      .from(loanProducts)
      .where(eq(loanProducts.id, id));
    return product;
  } catch (error) {
    return null;
  }
}

async function getProductApplications(productId: string) {
  try {
    return await db
      .select({
        id: loanApplications.id,
        applicationNumber: loanApplications.applicationNumber,
        requestedAmount: loanApplications.requestedAmount,
        status: loanApplications.status,
        createdAt: loanApplications.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(loanApplications)
      .leftJoin(customers, eq(loanApplications.customerId, customers.id))
      .where(eq(loanApplications.productId, productId))
      .orderBy(desc(loanApplications.createdAt))
      .limit(10);
  } catch {
    return [];
  }
}

async function getProductLoans(productId: string) {
  try {
    return await db
      .select({
        id: loans.id,
        loanNumber: loans.loanNumber,
        principalAmount: loans.principalAmount,
        totalOutstanding: loans.totalOutstanding,
        status: loans.status,
        disbursedAt: loans.disbursedAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(loans)
      .leftJoin(customers, eq(loans.customerId, customers.id))
      .where(eq(loans.productId, productId))
      .orderBy(desc(loans.createdAt))
      .limit(10);
  } catch {
    return [];
  }
}

async function getProductStats(productId: string) {
  try {
    const [appCount] = await db
      .select({ count: count() })
      .from(loanApplications)
      .where(eq(loanApplications.productId, productId));

    const [loanCount] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.productId, productId));

    return {
      applications: appCount?.count ?? 0,
      loans: loanCount?.count ?? 0,
    };
  } catch {
    return { applications: 0, loans: 0 };
  }
}

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductDetails(id);

  if (!product) {
    notFound();
  }

  const [applications, productLoans, stats] = await Promise.all([
    getProductApplications(id),
    getProductLoans(id),
    getProductStats(id),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <RiArrowLeftLine className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {product.name}
              </h1>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {product.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2">
            <RiEditLine className="h-4 w-4" />
            Edit Product
          </Button>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <RiFileListLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Applications</p>
                <p className="text-xl font-semibold">{stats.applications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <RiMoneyDollarCircleLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Loans</p>
                <p className="text-xl font-semibold">{stats.loans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <RiPercentLine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="text-xl font-semibold">{formatPercent(product.interestRatePercent)} p.a.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-info/10">
                <RiShieldLine className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max LTV</p>
                <p className="text-xl font-semibold">{formatPercent(product.maxLtvPercent ?? 50)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Product Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <RiStackLine className="h-4 w-4" />
            Product Configuration
          </CardTitle>
          <CardDescription>Loan terms and eligibility criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Loan Amount */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
                Loan Amount Range
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum</span>
                  <span className="font-mono">{formatCurrency(product.minAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Maximum</span>
                  <span className="font-mono">{formatCurrency(product.maxAmount)}</span>
                </div>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                Tenure Range
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum</span>
                  <span>{product.minTenureMonths} months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Maximum</span>
                  <span>{product.maxTenureMonths} months</span>
                </div>
              </div>
            </div>

            {/* Interest & Fees */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RiPercentLine className="h-4 w-4 text-muted-foreground" />
                Interest & Fees
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-mono">{formatPercent(product.interestRatePercent)} p.a.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-mono">{formatPercent(product.processingFeePercent ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* LTV Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RiShieldLine className="h-4 w-4 text-muted-foreground" />
                LTV Settings
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max LTV</span>
                  <span className="font-mono">{formatPercent(product.maxLtvPercent ?? 50)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margin Call</span>
                  <span className="font-mono">{formatPercent(product.marginCallThreshold ?? 60)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Liquidation</span>
                  <span className="font-mono">{formatPercent(product.liquidationThreshold ?? 70)}</span>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RiCheckLine className="h-4 w-4 text-muted-foreground" />
                Eligibility Criteria
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Credit Score</span>
                  <span className="font-mono">{product.minCreditScore ?? "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Monthly Income</span>
                  <span className="font-mono">
                    {product.minMonthlyIncome ? formatCurrency(product.minMonthlyIncome) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RiTimeLine className="h-4 w-4 text-muted-foreground" />
                Metadata
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(product.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(product.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RiFileListLine className="h-4 w-4" />
              Recent Applications
            </CardTitle>
            <CardDescription>Latest applications for this product</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-sm">
                      {app.applicationNumber.slice(0, 16)}...
                    </TableCell>
                    <TableCell>
                      {app.customerFirstName} {app.customerLastName}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(app.requestedAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(app.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/applications/${app.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Loans */}
      {productLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RiMoneyDollarCircleLine className="h-4 w-4" />
              Active Loans
            </CardTitle>
            <CardDescription>Loans disbursed under this product</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Disbursed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-mono text-sm">
                      {loan.loanNumber.slice(0, 16)}...
                    </TableCell>
                    <TableCell>
                      {loan.customerFirstName} {loan.customerLastName}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.principalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(loan.totalOutstanding ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(loan.disbursedAt)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
