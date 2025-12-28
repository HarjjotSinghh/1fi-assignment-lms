import { 
  RiCodeBoxLine, 
  RiFileCopyLine, 
  RiExternalLinkLine 
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApiDocsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">API Reference</h1>
            <Badge variant="outline">v2.0</Badge>
          </div>
          <p className="text-muted-foreground">Integration guide for partners and developers.</p>
        </div>
        <Link href="/configuration/partners">
          <Button variant="outline" className="gap-2">
            <RiExternalLinkLine className="w-4 h-4" />
            Manage API Keys
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="intro" className="w-full">
         <TabsList>
            <TabsTrigger value="intro">Introduction</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="loans">Loan APIs</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
         </TabsList>

         <div className="mt-6 space-y-8">
            <TabsContent value="intro">
                <DocsSection 
                    title="Getting Started" 
                    description="Welcome to the Fiquity Lending Engine API. Our RESTful API allows you to integrate loan origination, management, and collection capabilities directly into your application."
                >
                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                        <div className="p-4 border rounded-lg bg-card">
                            <h3 className="font-semibold mb-2">Base URL</h3>
                            <code className="bg-muted px-2 py-1 rounded text-sm block w-full">https://api.fiquity.finance/v1</code>
                        </div>
                         <div className="p-4 border rounded-lg bg-card">
                            <h3 className="font-semibold mb-2">Content-Type</h3>
                            <code className="bg-muted px-2 py-1 rounded text-sm block w-full">application/json</code>
                        </div>
                    </div>
                </DocsSection>
            </TabsContent>

            <TabsContent value="auth">
                 <DocsSection title="Authentication" description="Authenticate requests using your API Key via Bearer Token.">
                    <CodeBlock 
                        title="Authorization Header"
                        code={`Authorization: Bearer sk_live_...`} 
                    />
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-md text-sm text-amber-800">
                        <strong>Security Note:</strong> Never share your secret key. Perform all API requests from your backend server.
                    </div>
                </DocsSection>
            </TabsContent>

            <TabsContent value="loans">
                 <DocsSection title="Create Application" description="Submit a new loan application.">
                    <CodeBlock 
                        method="POST"
                        url="/applications"
                        code={`{
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  },
  "loan": {
    "amount": 5000000,
    "tenure": 24,
    "productId": "prod_12345"
  }
}`}
                    />
                </DocsSection>
                <div className="mt-8"></div>
                <DocsSection title="Check Status" description="Get the status of an application.">
                    <CodeBlock 
                        method="GET"
                        url="/applications/:id/status"
                    />
                </DocsSection>
            </TabsContent>

            <TabsContent value="webhooks">
                 <DocsSection title="Webhook Events" description="Listen for realtime events from the lending engine.">
                    <div className="border rounded-md divide-y">
                        <div className="p-4 flex items-center justify-between">
                            <code className="text-sm font-semibold">application.status_changed</code>
                            <span className="text-sm text-muted-foreground">When app status changes (e.g. Approved)</span>
                        </div>
                         <div className="p-4 flex items-center justify-between">
                            <code className="text-sm font-semibold">loan.disbursed</code>
                            <span className="text-sm text-muted-foreground">Funds transferred to customer</span>
                        </div>
                         <div className="p-4 flex items-center justify-between">
                            <code className="text-sm font-semibold">payment.received</code>
                            <span className="text-sm text-muted-foreground">Repayment successfully processed</span>
                        </div>
                    </div>
                </DocsSection>
            </TabsContent>
         </div>
      </Tabs>
    </div>
  );
}

function DocsSection({ title, description, children }: any) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground max-w-2xl">{description}</p>
            {children}
        </div>
    )
}

function CodeBlock({ title, code, method, url }: any) {
    return (
        <div className="rounded-lg border bg-stone-900 text-stone-50 overflow-hidden">
            {(title || method) && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-950/50">
                    <div className="flex items-center gap-2">
                        {method && (
                            <Badge variant="outline" className={`font-mono ${method === 'POST' ? 'text-green-400 border-green-900' : 'text-blue-400 border-blue-900'}`}>
                                {method}
                            </Badge>
                        )}
                        {url && (
                             <span className="font-mono text-xs opacity-70">{url}</span>
                        )}
                        {title && !method && <span className="text-sm font-semibold">{title}</span>}
                    </div>
                    {code && (
                        <div className="flex items-center gap-1 text-xs opacity-50 cursor-pointer hover:opacity-100">
                             <RiFileCopyLine /> Copy
                        </div>
                    )}
                </div>
            )}
            {code && (
                <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                    {code}
                </pre>
            )}
        </div>
    )
}
