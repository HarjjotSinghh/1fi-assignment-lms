import { db } from "@/db";
import { loanApplications, customers, loanProducts, collaterals, applicationStatusHistory, documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiShieldLine,
  RiTimeLine,
  RiUserLine,
  RiFileTextLine,
  RiHistoryLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DocumentActions } from "@/components/applications/document-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

async function getApplicationDetails(id: string) {
  try {
    const [application] = await db
      .select({
        id: loanApplications.id,
        applicationNumber: loanApplications.applicationNumber,
        requestedAmount: loanApplications.requestedAmount,
        approvedAmount: loanApplications.approvedAmount,
        tenure: loanApplications.tenure,
        status: loanApplications.status,
        statusReason: loanApplications.statusReason,
        source: loanApplications.source,
        externalReference: loanApplications.externalReference,
        submittedAt: loanApplications.submittedAt,
        reviewedAt: loanApplications.reviewedAt,
        approvedAt: loanApplications.approvedAt,
        rejectedAt: loanApplications.rejectedAt,
        disbursedAt: loanApplications.disbursedAt,
        createdAt: loanApplications.createdAt,
        customerId: loanApplications.customerId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        customerKycStatus: customers.kycStatus,
        productId: loanApplications.productId,
        productName: loanProducts.name,
        productInterestRate: loanProducts.interestRatePercent,
      })
      .from(loanApplications)
      .leftJoin(customers, eq(loanApplications.customerId, customers.id))
      .leftJoin(loanProducts, eq(loanApplications.productId, loanProducts.id))
      .where(eq(loanApplications.id, id));

    return application;
  } catch (error) {
    return null;
  }
}

async function getApplicationCollaterals(applicationId: string) {
  try {
    return await db
      .select()
      .from(collaterals)
      .where(eq(collaterals.applicationId, applicationId));
  } catch {
    return [];
  }
}

async function getStatusHistory(applicationId: string) {
  try {
    return await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.createdAt));
  } catch {
    return [];
  }
}

async function getApplicationDocuments(applicationId: string) {
  try {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.applicationId, applicationId));
  } catch {
    return [];
  }
}

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const application = await getApplicationDetails(id);

  if (!application) {
    notFound();
  }

  const [appCollaterals, statusHistory, appDocuments] = await Promise.all([
    getApplicationCollaterals(id),
    getStatusHistory(id),
    getApplicationDocuments(id),
  ]);

  const totalCollateralValue = appCollaterals.reduce(
    (sum, c) => sum + c.currentValue,
    0
  );

  const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(application.status);

  const statusIcons: Record<string, React.ReactNode> = {
    DRAFT: <RiTimeLine className="h-4 w-4" />,
    SUBMITTED: <RiFileListLine className="h-4 w-4" />,
    UNDER_REVIEW: <RiTimeLine className="h-4 w-4" />,
    APPROVED: <RiCheckLine className="h-4 w-4" />,
    REJECTED: <RiCloseLine className="h-4 w-4" />,
    DISBURSED: <RiMoneyDollarCircleLine className="h-4 w-4" />,
    CANCELLED: <RiCloseLine className="h-4 w-4" />,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/applications">
            <Button variant="ghost" size="icon" className="rounded-none">
              <RiArrowLeftLine className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {application.applicationNumber}
              </h1>
              <Badge className={`gap-1.5 ${getStatusColor(application.status)}`}>
                {statusIcons[application.status]}
                {application.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {application.customerFirstName} {application.customerLastName} • {application.productName}
            </p>
          </div>
        </div>
        {isPending && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-none gap-2 text-destructive hover:text-destructive">
              <RiCloseLine className="h-4 w-4" />
              Reject
            </Button>
            <Button className="rounded-none gap-2">
              <RiCheckLine className="h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <RiFileListLine className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="collateral" className="gap-2">
            <RiShieldLine className="h-4 w-4" /> Collateral
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <RiFileTextLine className="h-4 w-4" /> Documents
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <RiHistoryLine className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-primary/10">
                    <RiMoneyDollarCircleLine className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requested Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(application.requestedAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-success/10">
                    <RiCheckLine className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Approved Amount</p>
                    <p className="text-xl font-semibold">
                      {application.approvedAmount ? formatCurrency(application.approvedAmount) : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-accent/10">
                    <RiTimeLine className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tenure</p>
                    <p className="text-xl font-semibold">{application.tenure} months</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-info/10">
                    <RiShieldLine className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collateral Value</p>
                    <p className="text-xl font-semibold">
                      {totalCollateralValue > 0 ? formatCurrency(totalCollateralValue) : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Details Grid */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Application Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium">Application Details</CardTitle>
                <CardDescription>Complete application information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Application Number</span>
                      <span className="font-mono">{application.applicationNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Product</span>
                      <span>{application.productName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interest Rate</span>
                      <span>{application.productInterestRate}% p.a.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Source</span>
                      <Badge variant="outline">{application.source}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDate(application.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Submitted</span>
                      <span>{application.submittedAt ? formatDate(application.submittedAt) : "-"}</span>
                    </div>
                    {application.approvedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Approved</span>
                        <span>{formatDate(application.approvedAt)}</span>
                      </div>
                    )}
                    {application.rejectedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rejected</span>
                        <span>{formatDate(application.rejectedAt)}</span>
                      </div>
                    )}
                    {application.externalReference && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">External Ref</span>
                        <span className="font-mono">{application.externalReference}</span>
                      </div>
                    )}
                  </div>
                </div>

                {application.statusReason && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Status Reason</p>
                    <p className="text-sm">{application.statusReason}</p>
                  </div>
                )}
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
                  <p className="font-medium">
                    {application.customerFirstName} {application.customerLastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{application.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{application.customerPhone}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">KYC Status</span>
                  <Badge className={getStatusColor(application.customerKycStatus ?? "PENDING")}>
                    {application.customerKycStatus}
                  </Badge>
                </div>
                <Link href={`/customers/${application.customerId}`}>
                  <Button variant="outline" size="sm" className="w-full rounded-none">
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="collateral" className="animate-fade-in">
          {appCollaterals.length > 0 ? (
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
                    {appCollaterals.map((collateral) => (
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
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No collateral pledged used for this application.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <RiFileTextLine className="h-4 w-4" />
                Required Documents
              </CardTitle>
              <CardDescription>
                Documents submitted for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appDocuments.length > 0 ? (
                    appDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <RiFileTextLine className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {doc.verified ? (
                            <Badge className="bg-success text-success-foreground hover:bg-success/90">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                            <DocumentActions
                              documentId={doc.id}
                              isVerified={!!doc.verified}
                              applicationId={id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No documents found for this application.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="animate-fade-in">
          {statusHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Status History</CardTitle>
                <CardDescription>Timeline of application status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4">
                  {statusHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-muted-foreground/20 absolute top-3" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(history.status)}>{history.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(history.createdAt)}
                          </span>
                        </div>
                        {history.comment && (
                          <p className="text-sm text-muted-foreground mt-1">{history.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No history available.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
