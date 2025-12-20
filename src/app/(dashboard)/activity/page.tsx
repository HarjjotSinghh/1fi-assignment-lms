import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import {
  RiHistoryLine,
  RiDownloadLine,
  RiFilterLine,
  RiUserLine,
  RiFileAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiExportLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiShieldLine,
  RiRefundLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { buildQueryString, getStringParam, type SearchParams } from "@/lib/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function getAuditLogs(limit: number = 50) {
  try {
    return await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <RiFileAddLine className="h-4 w-4" />,
  UPDATE: <RiEditLine className="h-4 w-4" />,
  DELETE: <RiDeleteBinLine className="h-4 w-4" />,
  APPROVE: <RiCheckLine className="h-4 w-4" />,
  REJECT: <RiCloseLine className="h-4 w-4" />,
  DISBURSE: <RiMoneyDollarCircleLine className="h-4 w-4" />,
  EXPORT: <RiExportLine className="h-4 w-4" />,
  LOGIN: <RiLoginBoxLine className="h-4 w-4" />,
  LOGOUT: <RiLogoutBoxLine className="h-4 w-4" />,
  KYC_VERIFY: <RiShieldCheckLine className="h-4 w-4" />,
  COLLATERAL_PLEDGE: <RiShieldLine className="h-4 w-4" />,
  COLLATERAL_RELEASE: <RiShieldLine className="h-4 w-4" />,
  PAYMENT_RECEIVED: <RiRefundLine className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-info/10 text-info border-info/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  APPROVE: "bg-success/10 text-success border-success/20",
  REJECT: "bg-destructive/10 text-destructive border-destructive/20",
  DISBURSE: "bg-primary/10 text-primary border-primary/20",
  EXPORT: "bg-muted text-muted-foreground",
  LOGIN: "bg-info/10 text-info border-info/20",
  LOGOUT: "bg-muted text-muted-foreground",
  KYC_VERIFY: "bg-success/10 text-success border-success/20",
  COLLATERAL_PLEDGE: "bg-warning/10 text-warning border-warning/20",
  COLLATERAL_RELEASE: "bg-accent/10 text-accent border-accent/20",
  PAYMENT_RECEIVED: "bg-success/10 text-success border-success/20",
};

const entityLinks: Record<string, string> = {
  LOAN: "/loans",
  APPLICATION: "/applications",
  CUSTOMER: "/customers",
  COLLATERAL: "/collateral",
  PRODUCT: "/products",
};

type ActivityPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const params = await searchParams;
  const filterAction = getStringParam(params.action);
  const filterEntity = getStringParam(params.entity);

  const logs = await getAuditLogs(100);

  // Filter logs based on search params
  const filteredLogs = logs.filter((log) => {
    if (filterAction && filterAction !== "all" && log.action !== filterAction) return false;
    if (filterEntity && filterEntity !== "all" && log.entityType !== filterEntity) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <RiHistoryLine className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Activity Log</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Complete audit trail of all significant actions in the system for compliance and monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2" asChild>
            <a href="/api/audit-logs?format=csv" download>
              <RiDownloadLine className="h-4 w-4" />
              Export logs
            </a>
          </Button>
        </div>
      </section>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <Select name="action" defaultValue={filterAction || "all"}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="APPROVE">Approve</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
                <SelectItem value="DISBURSE">Disburse</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
                <SelectItem value="KYC_VERIFY">KYC Verify</SelectItem>
              </SelectContent>
            </Select>

            <Select name="entity" defaultValue={filterEntity || "all"}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="LOAN">Loans</SelectItem>
                <SelectItem value="APPLICATION">Applications</SelectItem>
                <SelectItem value="CUSTOMER">Customers</SelectItem>
                <SelectItem value="COLLATERAL">Collateral</SelectItem>
                <SelectItem value="PRODUCT">Products</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="outline" className="rounded-xl gap-2">
              <RiFilterLine className="h-4 w-4" />
              Apply filters
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <RiHistoryLine className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground">
                System activity will appear here as actions are performed.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                  {/* Timeline indicator */}
                  <div className="relative flex flex-col items-center">
                    <div className={`p-2 rounded-xl ${actionColors[log.action] || "bg-muted"}`}>
                      {actionIcons[log.action] || <RiEditLine className="h-4 w-4" />}
                    </div>
                    {index < filteredLogs.length - 1 && (
                      <div className="w-0.5 h-full bg-border absolute top-10 bottom-0" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={actionColors[log.action] || "bg-muted"}>
                        {log.action.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">{log.entityType}</Badge>
                      {log.entityId && entityLinks[log.entityType] && (
                        <Link
                          href={`${entityLinks[log.entityType]}/${log.entityId}`}
                          className="text-xs text-primary hover:underline font-mono"
                        >
                          {log.entityId.slice(0, 8)}...
                        </Link>
                      )}
                    </div>
                    <p className="text-sm">{log.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <RiUserLine className="h-3 w-3" />
                        {log.userName || log.userEmail || "System"}
                      </span>
                      <span>{formatDate(log.createdAt)}</span>
                      {log.ipAddress && log.ipAddress !== "unknown" && (
                        <span className="font-mono">{log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
