"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiLineChartLine, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import { formatCurrency } from "@/lib/utils";

interface NavHistoryData {
  date: string;
  nav: number;
  value: number;
}

interface CollateralHistoryChartProps {
  collateralId: string;
  fundName: string;
  units: number;
  currentNav: number;
  currentValue: number;
  history: NavHistoryData[];
}

export function CollateralHistoryChart({
  fundName,
  units,
  currentNav,
  currentValue,
  history,
}: CollateralHistoryChartProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    if (history.length === 0) {
      return {
        minNav: currentNav,
        maxNav: currentNav,
        avgNav: currentNav,
        change30d: 0,
        changePercent: 0,
        trend: "stable" as const,
      };
    }

    const navValues = history.map((h) => h.nav);
    const minNav = Math.min(...navValues, currentNav);
    const maxNav = Math.max(...navValues, currentNav);
    const avgNav = navValues.reduce((a, b) => a + b, currentNav) / (navValues.length + 1);
    
    const oldestNav = history[history.length - 1]?.nav || currentNav;
    const change30d = currentNav - oldestNav;
    const changePercent = oldestNav > 0 ? ((currentNav - oldestNav) / oldestNav) * 100 : 0;
    const trend = change30d > 0 ? "up" : change30d < 0 ? "down" : "stable";

    return { minNav, maxNav, avgNav, change30d, changePercent, trend };
  }, [history, currentNav]);

  // Generate chart bars (simplified visual representation)
  const chartBars = useMemo(() => {
    const allData = [...history, { date: "Today", nav: currentNav, value: currentValue }];
    const maxValue = Math.max(...allData.map((d) => d.value));
    
    return allData.slice(-30).map((d, i) => ({
      ...d,
      height: maxValue > 0 ? (d.value / maxValue) * 100 : 0,
      isLast: i === allData.length - 1,
    }));
  }, [history, currentNav, currentValue]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RiLineChartLine className="h-5 w-5 text-primary" />
              NAV History
            </CardTitle>
            <CardDescription className="mt-1">
              {fundName} • {units.toLocaleString()} units
            </CardDescription>
          </div>
          <Badge
            className={`${
              metrics.trend === "up"
                ? "bg-success/10 text-success border-success/20"
                : metrics.trend === "down"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {metrics.trend === "up" ? (
              <RiArrowUpLine className="h-3 w-3 mr-1" />
            ) : metrics.trend === "down" ? (
              <RiArrowDownLine className="h-3 w-3 mr-1" />
            ) : null}
            {metrics.changePercent >= 0 ? "+" : ""}
            {metrics.changePercent.toFixed(2)}% (30d)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Value Highlight */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current NAV</p>
            <p className="text-lg font-semibold">₹{currentNav.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="text-lg font-semibold">{formatCurrency(currentValue)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">30d Change</p>
            <p
              className={`text-lg font-semibold ${
                metrics.change30d >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {metrics.change30d >= 0 ? "+" : ""}₹{metrics.change30d.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">NAV Range</p>
            <p className="text-sm font-medium">
              ₹{metrics.minNav.toFixed(2)} - ₹{metrics.maxNav.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Visual Chart */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Value Trend (Last 30 Days)
          </p>
          <div className="h-24 flex items-end gap-0.5">
            {chartBars.length > 0 ? (
              chartBars.map((bar, idx) => (
                <div
                  key={idx}
                  className="flex-1 group relative"
                  title={`${bar.date}: ₹${bar.nav.toFixed(2)} NAV, ${formatCurrency(bar.value)}`}
                >
                  <div
                    className={`w-full rounded-t-sm transition-colors ${
                      bar.isLast
                        ? "bg-primary"
                        : bar.height > 50
                        ? "bg-success/60 hover:bg-success/80"
                        : "bg-info/60 hover:bg-info/80"
                    }`}
                    style={{ height: `${Math.max(bar.height, 2)}%` }}
                  />
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No historical data available
              </div>
            )}
          </div>
          {chartBars.length > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{chartBars[0]?.date || ""}</span>
              <span>Today</span>
            </div>
          )}
        </div>

        {/* LTV Impact Section */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Value Impact Analysis
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">If NAV drops 10%:</p>
              <p className="font-medium text-destructive">
                {formatCurrency(currentValue * 0.9)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">If NAV rises 10%:</p>
              <p className="font-medium text-success">
                {formatCurrency(currentValue * 1.1)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified chart component for embedding in smaller cards
export function CollateralMiniChart({
  data,
  height = 40,
}: {
  data: { value: number }[];
  height?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.slice(-14).map((d, idx) => (
        <div
          key={idx}
          className="flex-1 bg-primary/40 hover:bg-primary/60 rounded-t-sm transition-colors"
          style={{ height: `${(d.value / maxValue) * 100}%` }}
        />
      ))}
    </div>
  );
}
