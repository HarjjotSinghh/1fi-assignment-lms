import { db } from "@/db";
import { loanApplications, customers, loanProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  RiAddLine,
  RiCheckLine,
  RiEyeLine,
  RiFileListLine,
  RiFilter3Line,
  RiMore2Line,
  RiSearchLine,
  RiTimeLine,
  RiCloseLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DRAFT: <RiTimeLine className="h-3.5 w-3.5" />,
  SUBMITTED: <RiTimeLine className="h-3.5 w-3.5" />,
  UNDER_REVIEW: <RiTimeLine className="h-3.5 w-3.5" />,
  APPROVED: <RiCheckLine className="h-3.5 w-3.5" />,
  REJECTED: <RiCloseLine className="h-3.5 w-3.5" />,
  DISBURSED: <RiCheckLine className="h-3.5 w-3.5" />,
  CANCELLED: <RiCloseLine className="h-3.5 w-3.5" />,
};

export default async function ApplicationsPage() {
  const applications = await getApplications();

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
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
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
            <Link href="/applications/new">
              <Button className="gap-2 rounded-xl">
                <RiAddLine className="h-4 w-4" />
                New application
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search applications..." className="pl-9 rounded-xl" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ButtonGroup className="rounded-xl border border-input bg-background/80 p-1">
                <Button variant="ghost" size="sm" className="rounded-lg bg-primary text-primary-foreground">
                  All
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                  Pending
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                  Approved
                </Button>
              </ButtonGroup>
              <Select defaultValue="recent">
                <SelectTrigger className="h-9 w-[160px] rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="amount">Highest amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="rounded-xl">
                <RiFilter3Line className="h-4 w-4" />
              </Button>
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
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiFileListLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Applications Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Create your first loan application to get started. You can also receive applications via API.
                </p>
              </div>
              <Link href="/applications/new">
                <Button className="press-scale rounded-xl">
                  <RiAddLine className="h-4 w-4 mr-2" />
                  Create application
                </Button>
              </Link>
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
                            <RiMore2Line className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <RiEyeLine className="h-4 w-4 mr-2" /> View details
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
