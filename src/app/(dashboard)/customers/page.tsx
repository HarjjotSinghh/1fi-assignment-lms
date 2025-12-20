import { db } from "@/db";
import { customers, loanApplications, loans } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import Link from "next/link";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MoreHorizontal,
  Shield,
  Mail,
  Phone,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getStatusColor, maskPan, maskAadhaar } from "@/lib/utils";

async function getCustomers() {
  try {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  } catch (error) {
    return [];
  }
}

export default async function CustomersPage() {
  const allCustomers = await getCustomers();

  const stats = {
    total: allCustomers.length,
    verified: allCustomers.filter((c) => c.kycStatus === "VERIFIED").length,
    pending: allCustomers.filter((c) => c.kycStatus === "PENDING").length,
    rejected: allCustomers.filter((c) => c.kycStatus === "REJECTED").length,
  };

  const kycStatusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-3.5 w-3.5" />,
    IN_PROGRESS: <Clock className="h-3.5 w-3.5" />,
    VERIFIED: <CheckCircle2 className="h-3.5 w-3.5" />,
    REJECTED: <XCircle className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer profiles, KYC verification status, and onboarding.
          </p>
        </div>
        <Link href="/applications/new">
          <Button className="gap-2 press-scale">
            <UserPlus className="h-4 w-4" />
            Onboard Customer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-heading font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">KYC Verified</p>
            <p className="text-2xl font-heading font-bold mt-1 text-success">{stats.verified}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">KYC Pending</p>
            <p className="text-2xl font-heading font-bold mt-1 text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">KYC Rejected</p>
            <p className="text-2xl font-heading font-bold mt-1 text-destructive">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      {allCustomers.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-primary/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Customers Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Start by onboarding your first customer. Complete KYC verification to process their loan application.
                </p>
              </div>
              <Link href="/applications/new">
                <Button className="press-scale">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Onboard Customer
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">All Customers</CardTitle>
              <Input placeholder="Search customers..." className="w-64" />
            </div>
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
              <TableBody>
                {allCustomers.map((customer) => (
                  <TableRow key={customer.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {customer.firstName[0]}
                            {customer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.employmentType?.replace("_", " ") || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {customer.email}
                        </p>
                        <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />
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
                          {customer.aadhaarNumber ? maskAadhaar(customer.aadhaarNumber) : "—"}
                        </span>
                        {customer.aadhaarVerified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {customer.panNumber ? maskPan(customer.panNumber) : "—"}
                        </span>
                        {customer.panVerified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {customer.city && customer.state
                        ? `${customer.city}, ${customer.state}`
                        : "—"}
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
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" /> Re-verify KYC
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
