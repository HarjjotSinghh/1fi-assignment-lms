import { db } from "@/db";
import { webhooks, webhookDeliveries, users } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import {
  RiGlobalLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiCheckLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WebhookActions } from "./webhook-actions";
import { WebhookSecret } from "./webhook-secret";

// Get all webhooks
async function getWebhooks() {
  try {
    const hooks = await db
      .select({
        id: webhooks.id,
        name: webhooks.name,
        url: webhooks.url,
        secret: webhooks.secret,
        events: webhooks.events,
        isActive: webhooks.isActive,
        lastTriggeredAt: webhooks.lastTriggeredAt,
        createdAt: webhooks.createdAt,
        userName: users.name,
      })
      .from(webhooks)
      .leftJoin(users, eq(webhooks.createdById, users.id))
      .orderBy(desc(webhooks.createdAt));

    return hooks;
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return [];
  }
}

// Get delivery stats
async function getDeliveryStats() {
  try {
    const [total] = await db.select({ count: count() }).from(webhookDeliveries);
    const [failed] = await db
      .select({ count: count() })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.status, "FAILED"));

    return {
      total: total.count,
      failed: failed.count,
      successRate: total.count > 0 ? ((total.count - failed.count) / total.count) * 100 : 100,
    };
  } catch {
    return { total: 0, failed: 0, successRate: 100 };
  }
}

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default async function WebhooksPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [hooks, stats] = await Promise.all([getWebhooks(), getDeliveryStats()]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 w-fit">
            Configuration
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Configure real-time notifications for system events. Webhooks allow you to receive instant updates when important things happen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="https://docs.webhook.site" target="_blank">
            <Button variant="outline" className="rounded-none gap-2">
              <RiExternalLinkLine className="h-4 w-4" />
              Documentation
            </Button>
          </Link>
          <WebhookActions mode="create" />
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-none p-2 bg-primary/10">
                <RiGlobalLine className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{hooks.length}</p>
              <p className="text-sm text-muted-foreground">Active Webhooks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-none p-2 bg-success/10">
                <RiCheckboxCircleLine className="h-5 w-5 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-none p-2 bg-info/10">
                <RiTimeLine className="h-5 w-5 text-info" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{stats.successRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Webhooks List */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiGlobalLine className="h-5 w-5 text-primary" />
              Configured Webhooks
            </CardTitle>
            <CardDescription>
              Manage your webhook endpoints and event subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hooks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-muted flex items-center justify-center rounded-full mb-3">
                  <RiGlobalLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No Webhooks Configured</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Add a webhook to start receiving event notifications.
                </p>
                <WebhookActions mode="create" />
              </div>
            ) : (
              <div className="space-y-4">
                {hooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="p-4 border rounded-none"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{hook.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {JSON.parse(hook.events).length} events
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 w-fit">
                          {hook.url}
                        </div>
                      </div>
                      <WebhookActions
                        mode="delete"
                        webhookId={hook.id}
                        webhookName={hook.name}
                      />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Created by {hook.userName}</span>
                        <span>•</span>
                        <span>Last triggered: {formatRelativeTime(hook.lastTriggeredAt)}</span>
                      </div>
                      <WebhookSecret secret={hook.secret} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
