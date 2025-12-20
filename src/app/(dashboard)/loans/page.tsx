import { db } from "@/db";
import { loans, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  RiMoneyDollarCircleLine,
  RiLineChartLine,
  RiCalendarLine,
  RiAlertLine,
  RiEyeLine,
  RiMore2Line,
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
import { Progress } from "@/components/ui/progress";
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

export default async function LoansPage() {
  const allLoans = await getLoans();

  const stats = {
    totalActive: allLoans.filter((l) => l.status === "ACTIVE").length,
    totalOutstanding: allLoans.reduce((sum, l) => sum + l.totalOutstanding, 0),
    avgLtv: allLoans.length > 0
      ? allLoans.reduce((sum, l) => sum + (l.currentLtv ?? 0), 0) / allLoans.length
      : 0,
    atRisk: allLoans.filter((l) => (l.currentLtv ?? 0) > 55).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Active Loans</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all active loans. Track EMI payments, LTV ratios, and loan health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Active Loans</p>
            <p className="text-2xl font-heading font-bold mt-1">{stats.totalActive}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-heading font-bold mt-1 text-primary">
              {formatCurrency(stats.totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Average LTV</p>
            <p className="text-2xl font-heading font-bold mt-1">
              {formatPercent(stats.avgLtv)}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">At Risk (LTV &gt; 55%)</p>
            <p className="text-2xl font-heading font-bold mt-1 text-warning">{stats.atRisk}</p>
          </CardContent>
        </Card>
      </div>

      {allLoans.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-primary/10 flex items-center justify-center">
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
      ) : (
        <Card className="border">
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
              <TableBody>
                {allLoans.map((loan) => {
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
                        {formatCurrency(loan.totalOutstanding)}
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
                              <RiEyeLine className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RiCalendarLine className="h-4 w-4 mr-2" /> EMI Schedule
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
