import { db } from "@/db";
import { loanApplications, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

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
  DRAFT: <Clock className="h-3.5 w-3.5" />,
  SUBMITTED: <Clock className="h-3.5 w-3.5" />,
  UNDER_REVIEW: <Clock className="h-3.5 w-3.5" />,
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
  DISBURSED: <CheckCircle2 className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
};

export default async function ApplicationsPage() {
  const applications = await getApplications();

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => ["SUBMITTED", "UNDER_REVIEW"].includes(a.status)).length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    disbursed: applications.filter((a) => a.status === "DISBURSED").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all loan applications across their lifecycle.
          </p>
        </div>
        <Link href="/applications/new">
          <Button className="gap-2 press-scale">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total Applications</p>
            <p className="text-2xl font-heading font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-heading font-bold mt-1 text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-heading font-bold mt-1 text-success">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Disbursed</p>
            <p className="text-2xl font-heading font-bold mt-1 text-primary">{stats.disbursed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-primary/10 flex items-center justify-center">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Applications Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Create your first loan application to get started. You can also receive applications via API.
                </p>
              </div>
              <Link href="/applications/new">
                <Button className="press-scale">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Application
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">All Applications</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search applications..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
              <TableBody>
                {applications.map((app) => (
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
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
