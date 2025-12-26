import { db } from "@/db";
import {
  customers,
  loanApplications,
  loans,
  collaterals,
  loanProducts,
  communicationLogs,
  creditLines,
  creditAccounts,
  creditTransactions
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiFileListLine,
  RiMailLine,
  RiMoneyDollarCircleLine,
  RiPhoneLine,
  RiShieldCheckLine,
  RiShieldLine,
  RiTimeLine,
  RiUserLine,
  RiNodeTree,
  RiMessage2Line
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getStatusColor, maskAadhaar, maskPan } from "@/lib/utils";
import { CollateralTreeVisualizer } from "@/components/collateral/collateral-tree-view";
import { CommunicationTimeline } from "@/components/customers/communication-timeline";

async function getCustomerDetails(id: string) {
  try {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  } catch (error) {
    return null;
  }
}

async function getCustomerApplications(customerId: string) {
  try {
    return await db
      .select({
        id: loanApplications.id,
        applicationNumber: loanApplications.applicationNumber,
        requestedAmount: loanApplications.requestedAmount,
        status: loanApplications.status,
        createdAt: loanApplications.createdAt,
        productName: loanProducts.name,
      })
      .from(loanApplications)
      .leftJoin(loanProducts, eq(loanApplications.productId, loanProducts.id))
      .where(eq(loanApplications.customerId, customerId))
      .orderBy(desc(loanApplications.createdAt));
  } catch {
    return [];
  }
}

async function getCustomerLoans(customerId: string) {
  try {
    return await db
      .select({
        id: loans.id,
        loanNumber: loans.loanNumber,
        principalAmount: loans.principalAmount,
        totalOutstanding: loans.totalOutstanding,
        status: loans.status,
        disbursedAt: loans.disbursedAt,
        productName: loanProducts.name,
      })
      .from(loans)
      .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
      .where(eq(loans.customerId, customerId))
      .orderBy(desc(loans.createdAt));
  } catch {
    return [];
  }
}

async function getCustomerCollaterals(customerId: string) {
  try {
    return await db
      .select()
      .from(collaterals)
      .where(eq(collaterals.customerId, customerId))
      .orderBy(desc(collaterals.createdAt));
  } catch {
    return [];
  }
}

async function getCustomerCommunications(customerId: string) {
  try {
    return await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.customerId, customerId))
      .orderBy(desc(communicationLogs.createdAt));
  } catch {
    return [];
  }
}

async function getCustomerCollateralTree(customerId: string, customerName: string, customerPan: string) {
  try {
    const lines = await db.select().from(creditLines).where(eq(creditLines.customerId, customerId));

    const linesWithChildren = await Promise.all(lines.map(async (line) => {
      const accounts = await db.select().from(creditAccounts).where(eq(creditAccounts.creditLineId, line.id));

      const accountsWithChildren = await Promise.all(accounts.map(async (account) => {
        const transactions = await db.select()
          .from(creditTransactions)
          .where(eq(creditTransactions.creditAccountId, account.id))
          .limit(5);

        return {
          ...account,
          type: "CREDIT_ACCOUNT",
          children: transactions.map(t => ({ ...t, type: "TRANSACTION", name: `Txn: ${t.amount}` }))
        };
      }));

      return {
        ...line,
        type: "CREDIT_LINE",
        children: accountsWithChildren
      };
    }));

    if (linesWithChildren.length === 0) return null;

    return {
      id: "root",
      name: customerName,
      type: "ROOT",
      details: { pan: customerPan },
      children: linesWithChildren
    };
  } catch {
    return null;
  }
}

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getCustomerDetails(id);

  if (!customer) {
    notFound();
  }

  const [applications, customerLoans, customerCollaterals, communications, collateralTree] = await Promise.all([
    getCustomerApplications(id),
    getCustomerLoans(id),
    getCustomerCollaterals(id),
    getCustomerCommunications(id),
    getCustomerCollateralTree(id, `${customer.firstName} ${customer.lastName}`, customer.panNumber ?? '')
  ]);

  const initials = `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase();
  const totalCollateralValue = customerCollaterals.reduce((sum, c) => sum + c.currentValue, 0);
  const totalOutstanding = customerLoans.reduce((sum, l) => sum + (l.totalOutstanding ?? 0), 0);

  const kycStatusIcon = {
    PENDING: <RiTimeLine className="h-4 w-4" />,
    IN_PROGRESS: <RiTimeLine className="h-4 w-4" />,
    VERIFIED: <RiCheckLine className="h-4 w-4" />,
    REJECTED: <RiCloseLine className="h-4 w-4" />,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon" className="rounded-none">
              <RiArrowLeftLine className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {initials || "NA"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {customer.firstName} {customer.lastName}
              </h1>
              <Badge className={`gap-1.5 ${getStatusColor(customer.kycStatus)}`}>
                {kycStatusIcon[customer.kycStatus as keyof typeof kycStatusIcon]}
                {customer.kycStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-none gap-2">
            <RiShieldCheckLine className="h-4 w-4" />
            Re-verify KYC
          </Button>
          <Button variant="outline" className="rounded-none gap-2" asChild>
            <a href={`/api/export/customers?id=${id}`}>
              <RiDownloadLine className="h-4 w-4" />
              Export
            </a>
          </Button>
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <RiUserLine className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="collateral" className="gap-2">
            <RiNodeTree className="h-4 w-4" /> Collateral Tree
          </TabsTrigger>
          <TabsTrigger value="communication" className="gap-2">
            <RiMessage2Line className="h-4 w-4" /> Communication
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-fade-in">
          {/* Summary Cards */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-primary/10">
                    <RiFileListLine className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Applications</p>
                    <p className="text-xl font-semibold">{applications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-success/10">
                    <RiMoneyDollarCircleLine className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Loans</p>
                    <p className="text-xl font-semibold">
                      {customerLoans.filter(l => l.status === "ACTIVE").length}
                    </p>
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
                    <p className="text-xs text-muted-foreground">Total Outstanding</p>
                    <p className="text-xl font-semibold">{formatCurrency(totalOutstanding)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-accent/10">
                    <RiShieldLine className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collateral Value</p>
                    <p className="text-xl font-semibold">{formatCurrency(totalCollateralValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Profile Details Grid */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RiUserLine className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Full Name</span>
                      <span>{customer.firstName} {customer.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date of Birth</span>
                      <span>{formatDate(customer.dateOfBirth)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <RiMailLine className="h-3 w-3" /> Email
                      </span>
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <RiPhoneLine className="h-3 w-3" /> Phone
                      </span>
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Employment</span>
                      <span>{customer.employmentType?.replace("_", " ") || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Company</span>
                      <span>{customer.companyName || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Income</span>
                      <span className="font-mono">
                        {customer.monthlyIncome ? formatCurrency(customer.monthlyIncome) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit Score</span>
                      <span className="font-mono">{customer.creditScore || "-"}</span>
                    </div>
                  </div>
                </div>

                {(customer.addressLine1 || customer.city) && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="text-sm">
                      {[customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KYC Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RiShieldCheckLine className="h-4 w-4" />
                  KYC Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aadhaar</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {customer.aadhaarNumber ? maskAadhaar(customer.aadhaarNumber) : "-"}
                    </span>
                    {customer.aadhaarVerified && <RiCheckLine className="h-4 w-4 text-success" />}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">PAN</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {customer.panNumber ? maskPan(customer.panNumber) : "-"}
                    </span>
                    {customer.panVerified && <RiCheckLine className="h-4 w-4 text-success" />}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                  <span className="font-mono">{customer.riskScore || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm">{formatDate(customer.createdAt)}</span>
                </div>

                {customer.kycRejectionReason && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                    <p className="text-sm text-destructive">{customer.kycRejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Applications */}
          {applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RiFileListLine className="h-4 w-4" />
                  Loan Applications
                </CardTitle>
                <CardDescription>Application history for this customer</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application #</TableHead>
                      <TableHead>Product</TableHead>
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
                        <TableCell>{app.productName}</TableCell>
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
          {customerLoans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RiMoneyDollarCircleLine className="h-4 w-4" />
                  Loans
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disbursed</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-sm">
                          {loan.loanNumber.slice(0, 16)}...
                        </TableCell>
                        <TableCell>{loan.productName}</TableCell>
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

          {/* Collateral Holdings (List View) */}
          {customerCollaterals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RiShieldLine className="h-4 w-4" />
                  Collateral Holdings
                </CardTitle>
                <CardDescription>
                  Total value: {formatCurrency(totalCollateralValue)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scheme</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerCollaterals.map((collateral) => (
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
        </TabsContent>

        <TabsContent value="collateral" className="animate-fade-in border rounded-none bg-background min-h-[500px]">
          <CollateralTreeVisualizer data={collateralTree} />
        </TabsContent>

        <TabsContent value="communication" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <RiMessage2Line className="h-4 w-4" />
                Communication History
              </CardTitle>
              <CardDescription>
                Timeline of SMS, Email, and WhatsApp communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommunicationTimeline logs={communications} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
