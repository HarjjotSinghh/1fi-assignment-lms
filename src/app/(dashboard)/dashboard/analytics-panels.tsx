"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  RiBarChart2Line,
  RiDownloadLine,
  RiFilter3Line,
  RiLineChartLine,
  RiPieChart2Line,
  RiShieldCheckLine,
  RiTimeLine,
  RiUserLine,
} from "react-icons/ri";
import { LucideArrowUpRight, LucideArrowDownRight } from "lucide-react";

type AnalyticsPanelsProps = {
  totalDisbursed: number;
  totalCollateralValue: number;
  activeLoans: number;
  applications: number;
};

const disbursalData = [
  { month: "Jan", disbursed: 12.6, outstanding: 8.9 },
  { month: "Feb", disbursed: 14.2, outstanding: 9.7 },
  { month: "Mar", disbursed: 15.8, outstanding: 10.1 },
  { month: "Apr", disbursed: 16.4, outstanding: 10.9 },
  { month: "May", disbursed: 18.1, outstanding: 11.6 },
  { month: "Jun", disbursed: 19.3, outstanding: 12.4 },
  { month: "Jul", disbursed: 21.2, outstanding: 13.1 },
  { month: "Aug", disbursed: 22.5, outstanding: 13.8 },
  { month: "Sep", disbursed: 24.1, outstanding: 14.2 },
  { month: "Oct", disbursed: 25.3, outstanding: 15.1 },
  { month: "Nov", disbursed: 26.8, outstanding: 16.2 },
  { month: "Dec", disbursed: 28.2, outstanding: 17.4 },
];

const portfolioDistribution = [
  { name: "Large Cap MF", share: 32 },
  { name: "Index Funds", share: 24 },
  { name: "Hybrid Funds", share: 18 },
  { name: "Debt Funds", share: 14 },
  { name: "Other", share: 12 },
];

const statusMix = [
  { key: "active", label: "Active", value: 64 },
  { key: "closed", label: "Closed", value: 22 },
  { key: "delayed", label: "Delayed", value: 14 },
];

const funnelStages = [
  { label: "Applications", value: 1280, percent: 100 },
  { label: "KYC Verified", value: 980, percent: 76 },
  { label: "Approved", value: 640, percent: 50 },
  { label: "Disbursed", value: 420, percent: 33 },
];

const repaymentSummary = [
  { label: "On-time", value: 78, note: "EMIs paid in last 30d" },
  { label: "Due soon", value: 16, note: "Next 7 days" },
  { label: "Overdue", value: 6, note: "Past 15 days" },
];

const segmentHighlights = [
  {
    title: "Large Cap LAMF",
    detail: "Portfolio share 28%",
    trend: "+6.2%",
    icon: RiLineChartLine,
  },
  {
    title: "Salary Advance",
    detail: "Avg ticket 5.4L",
    trend: "+4.1%",
    icon: RiUserLine,
  },
  {
    title: "Digital Origination",
    detail: "74% conversion",
    trend: "+9.1%",
    icon: RiShieldCheckLine,
  },
  {
    title: "Tier-1 Cities",
    detail: "41% share",
    trend: "+3.5%",
    icon: RiBarChart2Line,
  },
];

const trendConfig = {
  disbursed: { label: "Disbursed", color: "hsl(var(--chart-1))" },
  outstanding: { label: "Outstanding", color: "hsl(var(--chart-2))" },
};

const distributionConfig = {
  share: { label: "Portfolio share", color: "hsl(var(--chart-2))" },
};

const statusConfig = {
  active: { label: "Active", color: "hsl(var(--chart-1))" },
  closed: { label: "Closed", color: "hsl(var(--chart-4))" },
  delayed: { label: "Delayed", color: "hsl(var(--chart-3))" },
};

const formatCr = (value: number | string) => `${Number(value).toFixed(1)} Cr`;

export function DashboardAnalytics({
  totalDisbursed,
  totalCollateralValue,
  activeLoans,
  applications,
}: AnalyticsPanelsProps) {
  const conversionRate = applications ? Math.round((activeLoans / applications) * 100) : 0;
  const utilizationRate = totalCollateralValue
    ? Math.round((totalDisbursed / totalCollateralValue) * 100)
    : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Analytics
          </p>
          <h2 className="font-heading text-2xl font-bold">Portfolio Intelligence</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Monitor portfolio health, origination velocity, and repayment quality with live cohorts.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-full gap-2">
              <RiLineChartLine className="h-3.5 w-3.5" />
              {formatCurrency(totalDisbursed)} disbursed
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              Utilization {utilizationRate}%
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              Conversion {conversionRate}%
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonGroup className="rounded-none border border-input bg-background/80 p-1">
            <Button variant="ghost" size="sm" className="rounded-none bg-primary text-primary-foreground">
              30D
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none text-muted-foreground">
              90D
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none text-muted-foreground">
              YTD
            </Button>
          </ButtonGroup>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-[160px] rounded-none">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="lamf">LAMF Prime</SelectItem>
              <SelectItem value="gold">Gold Advantage</SelectItem>
              <SelectItem value="instant">Instant Liquidity</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-none gap-2">
            <RiFilter3Line className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="rounded-none gap-2">
            <RiDownloadLine className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 stagger-children">
        <Card className="lg:col-span-2 bg-card/90">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RiLineChartLine className="h-4 w-4 text-primary" />
                  Loan Disbursal Trend
                </CardTitle>
                <CardDescription>Disbursed vs outstanding book value (Cr)</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-success">
                <LucideArrowUpRight className="h-4 w-4" />
                +12.4% vs last quarter
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="aspect-auto h-[280px] w-full">
              <AreaChart data={disbursalData} margin={{ left: 0, right: 16, top: 10 }}>
                <defs>
                  <linearGradient id="fillDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-disbursed)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-disbursed)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-outstanding)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-outstanding)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCr}
                  width={56}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCr(value as number)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  stroke="var(--color-disbursed)"
                  fill="url(#fillDisbursed)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outstanding"
                  stroke="var(--color-outstanding)"
                  fill="url(#fillOutstanding)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiPieChart2Line className="h-4 w-4 text-primary" />
              Origination Funnel
            </CardTitle>
            <CardDescription>Application to disbursal conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-muted-foreground">
                    {stage.value.toLocaleString()} ({stage.percent}%)
                  </span>
                </div>
                <Progress value={stage.percent} className="h-2" />
              </div>
            ))}
            <div className="grid gap-3 rounded-none border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg approval time</span>
                <span className="font-medium">2.4 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Default rate</span>
                <span className="font-medium text-success">2.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">SLA breaches</span>
                <span className="font-medium text-warning">4.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 stagger-children">
        <Card className="lg:col-span-2 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiBarChart2Line className="h-4 w-4 text-primary" />
              Portfolio Distribution
            </CardTitle>
            <CardDescription>Share of collateral by product segment</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="aspect-auto h-[250px] w-full">
              <BarChart
                data={portfolioDistribution}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${Number(value).toFixed(0)}%`}
                    />
                  }
                />
                <Bar
                  dataKey="share"
                  fill="var(--color-share)"
                  radius={[6, 6, 6, 6]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiPieChart2Line className="h-4 w-4 text-primary" />
              Status Mix
            </CardTitle>
            <CardDescription>Active vs closed vs delayed</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="aspect-auto h-[230px] w-full">
              <PieChart>
                <Pie
                  data={statusMix}
                  dataKey="value"
                  nameKey="key"
                  innerRadius={60}
                  outerRadius={90}
                  stroke="transparent"
                >
                  {statusMix.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="key"
                      formatter={(value) => `${Number(value).toFixed(0)}%`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Default rate</span>
                <span className="font-medium text-success">2.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg time to approve</span>
                <span className="font-medium">2.4 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Portfolio risk score</span>
                <span className="font-medium">A-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 stagger-children">
        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiTimeLine className="h-4 w-4 text-primary" />
              Repayment Summary
            </CardTitle>
            <CardDescription>Collection quality for active loans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repaymentSummary.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
            <div className="rounded-none border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recovery rate</span>
                <span className="font-medium">96.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiShieldCheckLine className="h-4 w-4 text-primary" />
              Top Performing Segments
            </CardTitle>
            <CardDescription>Highest growth segments and ticket sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-3 stagger-children">
              {segmentHighlights.map((segment) => {
                const SegmentIcon = segment.icon;
                return (
                  <Item key={segment.title} className="flex-nowrap rounded-none border bg-background/60 px-4 py-3">
                    <ItemMedia
                      variant="icon"
                      className="rounded-none border-primary/20 bg-primary/10 text-primary"
                    >
                      <SegmentIcon className="h-4 w-4" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="text-sm">{segment.title}</ItemTitle>
                      <ItemDescription className="text-xs">{segment.detail}</ItemDescription>
                    </ItemContent>
                    <div className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
                      <LucideArrowUpRight className="h-3.5 w-3.5" />
                      {segment.trend}
                    </div>
                  </Item>
                );
              })}
            </ItemGroup>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {[
          {
            title: "KYC clearance",
            value: "94%",
            change: "+3.1%",
            icon: RiShieldCheckLine,
          },
          {
            title: "Avg ticket size",
            value: "5.6L",
            change: "+2.4%",
            icon: RiBarChart2Line,
          },
          {
            title: "Approval velocity",
            value: "2.1 days",
            change: "-12%",
            icon: RiTimeLine,
          },
          {
            title: "Customer growth",
            value: "18%",
            change: "+4.8%",
            icon: RiUserLine,
          },
        ].map((metric) => {
          const MetricIcon = metric.icon;
          const isNegative = metric.change.startsWith("-");
          return (
            <div
              key={metric.title}
              className="rounded-none border bg-background/70 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{metric.title}</span>
                <div className="rounded-full border bg-muted/40 p-1">
                  <MetricIcon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-3 text-xl font-semibold">{metric.value}</div>
              <div
                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                  isNegative ? "text-destructive" : "text-success"
                }`}
              >
                {isNegative ? (
                  <LucideArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <LucideArrowUpRight className="h-3.5 w-3.5" />
                )}
                {metric.change} vs last month
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
