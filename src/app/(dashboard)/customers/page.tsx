import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  RiCheckLine,
  RiEyeLine,
  RiMailLine,
  RiMore2Line,
  RiPhoneLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiUserAddLine,
  RiUserLine,
  RiCloseLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
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
              <Button className="gap-2 rounded-xl">
                <RiUserAddLine className="h-4 w-4" />
                Onboard customer
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-9 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="h-9 w-[180px] rounded-xl">
                <SelectValue placeholder="KYC status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {allCustomers.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiUserLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Customers Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Start by onboarding your first customer. Complete KYC verification to process their loan application.
                </p>
              </div>
              <Link href="/applications/new">
                <Button className="press-scale rounded-xl">
                  <RiUserAddLine className="h-4 w-4 mr-2" />
                  Onboard customer
                </Button>
              </Link>
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
              <TableBody>
                {allCustomers.map((customer) => {
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
                            <DropdownMenuItem>
                              <RiEyeLine className="h-4 w-4 mr-2" /> View profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RiShieldCheckLine className="h-4 w-4 mr-2" /> Re-verify KYC
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
