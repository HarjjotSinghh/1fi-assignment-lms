import Link from "next/link";
import {
  RiArrowRightLine,
  RiBankLine,
  RiBarChart2Line,
  RiCheckboxCircleLine,
  RiCustomerService2Line,
  RiFileListLine,
  RiFlashlightLine,
  RiLineChartLine,
  RiPieChart2Line,
  RiSecurePaymentLine,
  RiShieldCheckLine,
  RiStackLine,
  RiWallet3Line,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const heroCards = [
  { label: "Total disbursed", value: "INR 28.4 Cr", trend: "+12.4%" },
  { label: "Avg approval time", value: "2.1 days", trend: "-14%" },
  { label: "Active portfolios", value: "4,280", trend: "+6.8%" },
  { label: "Utilization rate", value: "74%", trend: "+2.1%" },
];

const capabilities = [
  {
    icon: RiFlashlightLine,
    title: "Instant origination",
    description: "Automate eligibility checks and approve loans in minutes.",
  },
  {
    icon: RiShieldCheckLine,
    title: "KYC and compliance",
    description: "Aadhaar + PAN workflows with configurable policy gates.",
  },
  {
    icon: RiStackLine,
    title: "Product configurator",
    description: "Define LTV limits, tenure ranges, and risk pricing.",
  },
  {
    icon: RiLineChartLine,
    title: "Portfolio intelligence",
    description: "Live trend monitoring with cohort and segment analytics.",
  },
  {
    icon: RiSecurePaymentLine,
    title: "Collateral lifecycle",
    description: "Track pledges, NAV updates, and margin calls in one view.",
  },
  {
    icon: RiCustomerService2Line,
    title: "Partner APIs",
    description: "Integrate origination and servicing into fintech stacks.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Customer onboarding",
    description: "Verify identity, risk band, and asset mix instantly.",
  },
  {
    step: "02",
    title: "Collateral pledge",
    description: "Link mutual fund units and validate pledge status.",
  },
  {
    step: "03",
    title: "Credit approval",
    description: "Auto-score, apply policy checks, and approve limits.",
  },
  {
    step: "04",
    title: "Disbursement",
    description: "Release funds with instant repayment scheduling.",
  },
];

const insights = [
  {
    title: "Top segments",
    value: "Large Cap LAMF",
    detail: "28% portfolio share",
    icon: RiPieChart2Line,
  },
  {
    title: "Risk outlook",
    value: "A- Grade",
    detail: "Default rate 2.1%",
    icon: RiShieldCheckLine,
  },
  {
    title: "Collections",
    value: "96.4% on-time",
    detail: "Last 30 days",
    icon: RiBankLine,
  },
];

const stats = [
  { value: "INR 50 Cr+", label: "Loans processed" },
  { value: "10K+", label: "Borrowers onboarded" },
  { value: "99.9%", label: "SLA uptime" },
  { value: "120+", label: "NBFC partners" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-primary flex items-center justify-center">
              <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">Fiquity Technology</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#capabilities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Capabilities
            </Link>
            <Link href="#workflow" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Workflow
            </Link>
            <Link href="#insights" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-none">
                Sign in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-none">
                Open dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-none border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 lg:p-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-6">
                <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
                  Trusted by 120+ NBFCs
                </Badge>
                <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                  Command your loan book with a modern LAMF platform.
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Orchestrate lending, collateral, and risk in one dashboard. Built for high-velocity
                  NBFC teams delivering loans against mutual funds.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/products">
                    <Button className="w-full sm:w-auto rounded-none text-base gap-2">
                      Start free trial
                      <RiArrowRightLine className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto rounded-none text-base">
                      Explore dashboard
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 stagger-children">
                {heroCards.map((card) => (
                  <Card key={card.label} className="bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                      <p className="mt-1 text-xs text-success">{card.trend} vs last month</p>
                    </CardContent>
                  </Card>
                ))}
                <Card className="bg-card/80 backdrop-blur-sm sm:col-span-2">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conversion funnel</span>
                      <span className="font-medium">33% disbursed</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: "33%" }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Applications</span>
                      <span>KYC</span>
                      <span>Approved</span>
                      <span>Disbursed</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card/70">
                <CardContent className="p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Capabilities
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Built for modern LAMF operations
            </h2>
            <p className="text-muted-foreground">
              Everything your team needs to originate, monitor, and grow the loan book with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {capabilities.map((capability) => (
              <Card key={capability.title} className="bg-card/80">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center">
                    <capability.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">{capability.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{capability.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="py-16 px-6 bg-muted/40">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Workflow
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold">
                A streamlined lending journey
              </h2>
              <p className="text-muted-foreground">
                Keep every team aligned from onboarding to disbursement with guided stages.
              </p>
            </div>
            <Link href="/applications/new">
              <Button className="rounded-none gap-2">
                Start an application
                <RiArrowRightLine className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 stagger-children">
            {workflow.map((item) => (
              <Card key={item.step} className="bg-card/80">
                <CardContent className="p-6 space-y-4">
                  <div className="text-3xl font-heading font-semibold text-primary/40">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Intelligence
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Analytics that drive confident decisions.
            </h2>
            <p className="text-muted-foreground">
              Blend portfolio trends, cohort analytics, and risk signals with export-ready reporting.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 stagger-children">
              {insights.map((item) => (
                <Card key={item.title} className="bg-card/80">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{item.title}</p>
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-base font-semibold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <RiBarChart2Line className="h-4 w-4 text-primary" />
              Cohorts, funnels, and product mix all in one dashboard.
            </div>
          </div>
          <div className="grid gap-4 stagger-children">
            <Card className="bg-card/80">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Loan performance</p>
                  <Badge variant="secondary" className="rounded-full">
                    Updated live
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-none border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Disbursed</p>
                    <p className="mt-2 text-xl font-semibold">INR 28.4 Cr</p>
                  </div>
                  <div className="rounded-none border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="mt-2 text-xl font-semibold">INR 17.4 Cr</p>
                  </div>
                </div>
                <div className="rounded-none border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Top performing segment</p>
                  <p className="mt-2 text-base font-semibold">Large Cap LAMF</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <RiFileListLine className="h-4 w-4 text-primary" />
                  Automation coverage
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-accent" style={{ width: "78%" }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  78% of approvals processed via automated policy checks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/40">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Trust and control
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Security-first operations.
            </h2>
            <p className="text-muted-foreground">
              Role-based access, audit trails, and configurable workflows keep every action compliant.
            </p>
            <div className="grid gap-3 stagger-children">
              {[
                "Audit logs for every transaction and approval step",
                "Role-based permissions for credit, ops, and risk teams",
                "Encrypted data storage with secure API access",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RiCheckboxCircleLine className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Card className="bg-card/80">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                  <RiShieldCheckLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Compliance readiness</p>
                  <p className="text-xs text-muted-foreground">Built for RBI-aligned reporting</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 stagger-children">
                <div className="rounded-none border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Audit coverage</p>
                  <p className="mt-2 text-lg font-semibold">100%</p>
                </div>
                <div className="rounded-none border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Access controls</p>
                  <p className="mt-2 text-lg font-semibold">Granular</p>
                </div>
              </div>
              <div className="rounded-none border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Data export</p>
                <p className="mt-2 text-sm font-medium">PDF, CSV, and API-ready snapshots</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-none border bg-gradient-to-br from-primary to-slate-900 p-10 text-primary-foreground">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-4">
                <h2 className="font-heading text-3xl md:text-4xl font-bold">
                  Ready to transform your lending operations?
                </h2>
                <p className="text-primary-foreground/80">
                  Activate faster loan cycles, smarter risk decisions, and a unified portfolio view with Fiquity Technology.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/products">
                  <Button className="w-full sm:w-auto rounded-none bg-background text-foreground">
                    Get started
                  </Button>
                </Link>
                <Link href="/api/external/applications">
                  <Button variant="outline" className="w-full sm:w-auto rounded-none border-primary-foreground/40 text-primary-foreground">
                    View API docs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-primary flex items-center justify-center">
                  <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-heading text-xl font-bold">Fiquity Technology</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                Modern loan management for the digital age.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</Link></li>
                <li><Link href="/products" className="hover:text-foreground transition-colors">Loan products</Link></li>
                <li><Link href="/api/external/applications" className="hover:text-foreground transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Insights</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <RiBankLine className="h-4 w-4" />
                  partnerships@1fi.in
                </li>
                <li className="flex items-center gap-2">
                  <RiCustomerService2Line className="h-4 w-4" />
                  +91 80 5555 0123
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Copyright {new Date().getFullYear()} Fiquity Technology. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
