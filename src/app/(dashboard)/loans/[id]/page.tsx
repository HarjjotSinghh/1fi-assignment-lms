import { db } from "@/db";
import { loans, customers, loanProducts, collaterals, emiSchedule, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiPercentLine,
  RiShieldLine,
  RiTimeLine,
  RiUserLine,
  RiFileListLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatPercent, getStatusColor } from "@/lib/utils";

async function getLoanDetails(id: string) {
  try {
    const [loan] = await db
      .select({
        id: loans.id,
        loanNumber: loans.loanNumber,
        principalAmount: loans.principalAmount,
        interestRate: loans.interestRate,
        tenure: loans.tenure,
        emiAmount: loans.emiAmount,
        outstandingPrincipal: loans.outstandingPrincipal,
        outstandingInterest: loans.outstandingInterest,
        totalOutstanding: loans.totalOutstanding,
        disbursedAmount: loans.disbursedAmount,
        disbursedAt: loans.disbursedAt,
        maturityDate: loans.maturityDate,
        status: loans.status,
        currentLtv: loans.currentLtv,
        createdAt: loans.createdAt,
        customerId: loans.customerId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        productId: loans.productId,
        productName: loanProducts.name,
        applicationId: loans.applicationId,
      })
      .from(loans)
      .leftJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
      .where(eq(loans.id, id));

    return loan;
  } catch (error) {
    return null;
  }
}

async function getLoanCollaterals(loanId: string) {
  try {
    return await db
      .select()
      .from(collaterals)
      .where(eq(collaterals.loanId, loanId));
  } catch {
    return [];
  }
}

async function getEmiSchedule(loanId: string) {
  try {
    return await db
      .select()
      .from(emiSchedule)
      .where(eq(emiSchedule.loanId, loanId))
      .orderBy(emiSchedule.installmentNo);
  } catch {
    return [];
  }
}

async function getLoanPayments(loanId: string) {
  try {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.loanId, loanId))
      .orderBy(payments.paymentDate);
  } catch {
    return [];
  }
}

type LoanDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = await params;
  const loan = await getLoanDetails(id);

  if (!loan) {
    notFound();
  }

  const [loanCollaterals, schedule, loanPayments] = await Promise.all([
    getLoanCollaterals(id),
    getEmiSchedule(id),
    getLoanPayments(id),
  ]);

  const totalCollateralValue = loanCollaterals.reduce(
    (sum, c) => sum + c.currentValue,
    0
  );
  const paidEmis = schedule.filter((e) => e.status === "PAID").length;
  const repaymentProgress = schedule.length ? (paidEmis / schedule.length) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/loans">
            <Button variant="ghost" size="icon" className="rounded-none">
              <RiArrowLeftLine className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {loan.loanNumber}
              </h1>
              <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {loan.customerFirstName} {loan.customerLastName} • {loan.productName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-none gap-2" asChild>
            <a href={`/api/export/loans?id=${id}`}>
              <RiDownloadLine className="h-4 w-4" />
              Export
            </a>
          </Button>
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
                <p className="text-xs text-muted-foreground">Principal Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(loan.principalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-warning/10">
                <RiTimeLine className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-xl font-semibold">{formatCurrency(loan.totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-accent/10">
                <RiPercentLine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="text-xl font-semibold">{formatPercent(loan.interestRate)} p.a.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-success/10">
                <RiCalendarLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">EMI Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(loan.emiAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Details Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Loan Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Loan Details</CardTitle>
            <CardDescription>Complete loan information and terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loan Number</span>
                  <span className="font-mono">{loan.loanNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tenure</span>
                  <span>{loan.tenure} months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disbursed Amount</span>
                  <span className="font-mono">{formatCurrency(loan.disbursedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disbursement Date</span>
                  <span>{formatDate(loan.disbursedAt)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Maturity Date</span>
                  <span>{formatDate(loan.maturityDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding Principal</span>
                  <span className="font-mono">{formatCurrency(loan.outstandingPrincipal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding Interest</span>
                  <span className="font-mono">{formatCurrency(loan.outstandingInterest)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current LTV</span>
                  <span className={`font-mono ${(loan.currentLtv ?? 0) > 55 ? "text-warning" : ""}`}>
                    {formatPercent(loan.currentLtv ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Repayment Progress</span>
                <span className="text-sm font-medium">{paidEmis} of {schedule.length} EMIs paid</span>
              </div>
              <Progress value={repaymentProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RiUserLine className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{loan.customerFirstName} {loan.customerLastName}</p>
              <p className="text-sm text-muted-foreground">{loan.customerEmail}</p>
              <p className="text-sm text-muted-foreground">{loan.customerPhone}</p>
            </div>
            <Link href={`/customers/${loan.customerId}`}>
              <Button variant="outline" size="sm" className="w-full rounded-none">
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Collateral Section */}
      {loanCollaterals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RiShieldLine className="h-4 w-4" />
              Pledged Collateral
            </CardTitle>
            <CardDescription>
              Total collateral value: {formatCurrency(totalCollateralValue)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheme</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Current NAV</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanCollaterals.map((collateral) => (
                  <TableRow key={collateral.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{collateral.schemeName}</p>
                        <p className="text-xs text-muted-foreground">{collateral.amcName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{collateral.schemeType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {collateral.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{collateral.currentNav.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(collateral.currentValue)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(collateral.pledgeStatus)}>
                        {collateral.pledgeStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* EMI Schedule */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RiFileListLine className="h-4 w-4" />
              EMI Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">EMI</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.slice(0, 12).map((emi) => (
                  <TableRow key={emi.id}>
                    <TableCell className="font-mono">{emi.installmentNo}</TableCell>
                    <TableCell>{formatDate(emi.dueDate)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(emi.emiAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(emi.principalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(emi.interestAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${getStatusColor(emi.status)}`}>
                        {emi.status === "PAID" ? (
                          <RiCheckLine className="h-3 w-3" />
                        ) : emi.status === "OVERDUE" ? (
                          <RiCloseLine className="h-3 w-3" />
                        ) : null}
                        {emi.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {schedule.length > 12 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Showing first 12 of {schedule.length} installments
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {loanPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.paymentMode}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.transactionRef || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
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
