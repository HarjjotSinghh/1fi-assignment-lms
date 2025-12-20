import { db } from "@/db";
import { approvals, users, loanApplications, loans, customers } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiShieldLine,
  RiTimeLine,
  RiUserLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

async function getPendingApprovals() {
  try {
    return await db
      .select({
        id: approvals.id,
        type: approvals.type,
        status: approvals.status,
        entityType: approvals.entityType,
        entityId: approvals.entityId,
        requestedAmount: approvals.requestedAmount,
        notes: approvals.notes,
        createdAt: approvals.createdAt,
        expiresAt: approvals.expiresAt,
        requestedById: approvals.requestedById,
        requesterName: users.name,
        requesterEmail: users.email,
      })
      .from(approvals)
      .leftJoin(users, eq(approvals.requestedById, users.id))
      .where(eq(approvals.status, "PENDING"))
      .orderBy(desc(approvals.createdAt));
  } catch {
    return [];
  }
}

async function getApprovalHistory() {
  try {
    return await db
      .select({
        id: approvals.id,
        type: approvals.type,
        status: approvals.status,
        entityType: approvals.entityType,
        entityId: approvals.entityId,
        requestedAmount: approvals.requestedAmount,
        reviewComment: approvals.reviewComment,
        createdAt: approvals.createdAt,
        reviewedAt: approvals.reviewedAt,
        requesterName: users.name,
      })
      .from(approvals)
      .leftJoin(users, eq(approvals.requestedById, users.id))
      .where(sql`${approvals.status} != 'PENDING'`)
      .orderBy(desc(approvals.reviewedAt))
      .limit(50);
  } catch {
    return [];
  }
}

async function getApprovalStats() {
  try {
    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvals)
      .where(eq(approvals.status, "PENDING"));

    const [approved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvals)
      .where(eq(approvals.status, "APPROVED"));

    const [rejected] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvals)
      .where(eq(approvals.status, "REJECTED"));

    return {
      pending: pending?.count ?? 0,
      approved: approved?.count ?? 0,
      rejected: rejected?.count ?? 0,
    };
  } catch {
    return { pending: 0, approved: 0, rejected: 0 };
  }
}

const typeIcons: Record<string, React.ReactNode> = {
  LOAN_APPROVAL: <RiFileListLine className="h-5 w-5" />,
  DISBURSEMENT: <RiMoneyDollarCircleLine className="h-5 w-5" />,
  KYC_OVERRIDE: <RiShieldCheckLine className="h-5 w-5" />,
  COLLATERAL_RELEASE: <RiShieldLine className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  LOAN_APPROVAL: "bg-primary/10 text-primary border-primary/20",
  DISBURSEMENT: "bg-success/10 text-success border-success/20",
  KYC_OVERRIDE: "bg-warning/10 text-warning border-warning/20",
  COLLATERAL_RELEASE: "bg-accent/10 text-accent border-accent/20",
};

const entityLinks: Record<string, string> = {
  APPLICATION: "/applications",
  LOAN: "/loans",
  CUSTOMER: "/customers",
};

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [pendingApprovals, history, stats] = await Promise.all([
    getPendingApprovals(),
    getApprovalHistory(),
    getApprovalStats(),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <RiCheckboxCircleLine className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Approvals</h1>
            {stats.pending > 0 && (
              <Badge className="bg-warning text-warning-foreground">
                {stats.pending} pending
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Review and manage pending approval requests for loans, disbursements, and overrides.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/10">
                <RiTimeLine className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <RiCheckLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-2xl font-semibold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10">
                <RiCloseLine className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-2xl font-semibold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <RiTimeLine className="h-4 w-4" />
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <RiCheckboxCircleLine className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Pending Approvals</CardTitle>
              <CardDescription>Review and take action on pending requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingApprovals.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <RiCheckboxCircleLine className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending approvals at the moment.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-xl ${typeColors[approval.type] || "bg-muted"}`}>
                          {typeIcons[approval.type] || <RiFileListLine className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{approval.type.replace(/_/g, " ")}</p>
                            <Badge variant="outline">{approval.entityType}</Badge>
                          </div>
                          {approval.requestedAmount && (
                            <p className="text-lg font-semibold text-primary">
                              {formatCurrency(approval.requestedAmount)}
                            </p>
                          )}
                          {approval.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{approval.notes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <RiUserLine className="h-3 w-3" />
                              {approval.requesterName || approval.requesterEmail}
                            </span>
                            <span>{formatDate(approval.createdAt)}</span>
                            {approval.expiresAt && (
                              <span className="text-warning">
                                Expires: {formatDate(approval.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {approval.entityId && entityLinks[approval.entityType] && (
                            <Button variant="outline" size="sm" className="rounded-xl" asChild>
                              <Link href={`${entityLinks[approval.entityType]}/${approval.entityId}`}>
                                View
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive">
                            <RiCloseLine className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="rounded-xl gap-1">
                            <RiCheckLine className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Approval History</CardTitle>
              <CardDescription>Past approval decisions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <RiCheckboxCircleLine className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No history yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed approvals will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4">
                      <div className={`p-2 rounded-xl ${typeColors[item.type] || "bg-muted"}`}>
                        {typeIcons[item.type] || <RiFileListLine className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.type.replace(/_/g, " ")}</p>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                        {item.reviewComment && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.reviewComment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested by {item.requesterName} • Reviewed {formatDate(item.reviewedAt ?? item.createdAt)}
                        </p>
                      </div>
                      {item.requestedAmount && (
                        <p className="font-mono text-sm">
                          {formatCurrency(item.requestedAmount)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
