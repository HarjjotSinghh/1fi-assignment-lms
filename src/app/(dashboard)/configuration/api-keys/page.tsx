import { db } from "@/db";
import { apiKeys, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
  RiKeyLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApiKeyActions } from "./api-key-actions";
import { RateLimitChart } from "./rate-limit-chart";

// Get all API keys for the admin view
async function getApiKeys() {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        key: apiKeys.key,
        name: apiKeys.name,
        description: apiKeys.description,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        userId: apiKeys.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.userId, users.id))
      .orderBy(desc(apiKeys.createdAt));

    return keys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return [];
  }
}

// Mask API key for display
function maskApiKey(key: string): string {
  if (key.length <= 12) return "••••••••••••";
  return key.substring(0, 8) + "••••••••" + key.substring(key.length - 4);
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

export default async function ApiKeysPage() {
  const session = await auth();
  
  // Only admins can access this page
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const keys = await getApiKeys();

  const activeKeys = keys.filter(k => k.isActive);
  const recentlyUsed = keys.filter(k => k.lastUsedAt).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 w-fit">
            Configuration
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage API keys for partner integrations. Partners use these keys to authenticate with the external API.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/api/external/applications" target="_blank">
            <Button variant="outline" className="rounded-none gap-2">
              <RiExternalLinkLine className="h-4 w-4" />
              API Documentation
            </Button>
          </Link>
          <ApiKeyActions mode="create" userId={session.user.id} />
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-none p-2 bg-primary/10">
                <RiKeyLine className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{keys.length}</p>
              <p className="text-sm text-muted-foreground">Total API Keys</p>
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
              <p className="text-2xl font-semibold">{activeKeys.length}</p>
              <p className="text-sm text-muted-foreground">Active Keys</p>
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
              <p className="text-2xl font-semibold">{recentlyUsed}</p>
              <p className="text-sm text-muted-foreground">Keys Used Recently</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Rate Limit Chart */}
      <section>
        <RateLimitChart />
      </section>

      {/* API Keys List */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiKeyLine className="h-5 w-5 text-primary" />
              API Keys
            </CardTitle>
            <CardDescription>
              All API keys in the system. Keys are masked for security - the full key is only shown once upon creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-muted flex items-center justify-center rounded-full mb-3">
                  <RiKeyLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No API Keys</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Create your first API key to enable partner integrations.
                </p>
                <ApiKeyActions mode="create" userId={session.user.id} />
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className={`flex items-center justify-between p-4 border rounded-none ${
                      !key.isActive ? "bg-muted/50 opacity-60" : ""
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        {key.isActive ? (
                          <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Revoked</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {maskApiKey(key.key)}
                      </p>
                      {key.description && (
                        <p className="text-xs text-muted-foreground">{key.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Created by: {key.userName || key.userEmail}</span>
                        <span>•</span>
                        <span>Last used: {formatRelativeTime(key.lastUsedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {key.isActive && (
                        <ApiKeyActions mode="revoke" keyId={key.id} keyName={key.name} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Usage Guide */}
      <section>
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">API Usage</CardTitle>
            <CardDescription>
              How to use API keys for partner integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">
                Include the API key in the <code className="px-1 py-0.5 bg-muted rounded text-xs">X-API-Key</code> header of your requests.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Example Request</p>
              <pre className="p-4 bg-slate-950 text-slate-50 rounded-none text-xs overflow-x-auto">
{`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/external/applications \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key-here" \\
  -d '{
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "dateOfBirth": "1990-01-15",
      "aadhaarNumber": "123456789012",
      "panNumber": "ABCDE1234F"
    },
    "loan": {
      "productId": "uuid-of-product",
      "requestedAmount": 500000,
      "tenure": 12
    },
    "externalReference": "PARTNER-REF-123"
  }'`}
              </pre>
            </div>
            <div className="pt-2">
              <Link href="/api/external/applications" target="_blank">
                <Button variant="outline" size="sm" className="rounded-none gap-2">
                  <RiExternalLinkLine className="h-4 w-4" />
                  View Full API Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
