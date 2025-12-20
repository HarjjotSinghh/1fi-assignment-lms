import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  RiNotification3Line,
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

async function getNotifications(userId: string) {
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch {
    return [];
  }
}

async function getUnreadCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userNotifications = await getNotifications(session.user.id);
  const unreadCount = await getUnreadCount(session.user.id);

  const typeIcons: Record<string, React.ReactNode> = {
    ALERT: <RiAlertLine className="h-5 w-5 text-warning" />,
    INFO: <RiInformationLine className="h-5 w-5 text-info" />,
    SUCCESS: <RiCheckboxCircleLine className="h-5 w-5 text-success" />,
    WARNING: <RiErrorWarningLine className="h-5 w-5 text-warning" />,
    ERROR: <RiErrorWarningLine className="h-5 w-5 text-destructive" />,
  };

  const typeColors: Record<string, string> = {
    ALERT: "bg-warning/10 border-warning/20",
    INFO: "bg-info/10 border-info/20",
    SUCCESS: "bg-success/10 border-success/20",
    WARNING: "bg-warning/10 border-warning/20",
    ERROR: "bg-destructive/10 border-destructive/20",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <RiNotification3Line className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Stay updated with system alerts, application status changes, and important notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2">
            <RiCheckDoubleLine className="h-4 w-4" />
            Mark all read
          </Button>
          <Button variant="outline" className="rounded-xl gap-2">
            <RiDeleteBinLine className="h-4 w-4" />
            Clear all
          </Button>
        </div>
      </section>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Notifications</CardTitle>
          <CardDescription>
            {userNotifications.length} notifications, {unreadCount} unread
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {userNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <RiNotification3Line className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {"You're all caught up! New notifications will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`p-2 rounded-xl ${typeColors[notification.type] || "bg-muted"}`}>
                    {typeIcons[notification.type] || <RiInformationLine className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {notification.link && (
                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                      <Link href={notification.link}>
                        <RiExternalLinkLine className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
