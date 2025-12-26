"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface RiskProfileProps {
    creditScore: number | null;
    riskScore: number | null;
}

export function RiskProfile({ creditScore, riskScore }: RiskProfileProps) {
    const score = creditScore || 0;

    // Gauge Data
    const data = [
        { name: "Score", value: score },
        { name: "Remaining", value: 900 - score }, // Max CIBIL is 900
    ];

    let riskLevel = "UNKNOWN";
    let riskColor = "bg-gray-500";
    let gaugeColor = "#e5e7eb";

    if (score >= 750) {
        riskLevel = "LOW RISK";
        riskColor = "bg-green-600";
        gaugeColor = "#16a34a"; // green-600
    } else if (score >= 650) {
        riskLevel = "MEDIUM RISK";
        riskColor = "bg-yellow-500";
        gaugeColor = "#eab308"; // yellow-500
    } else if (score > 0) {
        riskLevel = "HIGH RISK";
        riskColor = "bg-red-600";
        gaugeColor = "#dc2626"; // red-600
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Risk Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="relative h-[80px] w-[80px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={35}
                                    startAngle={180}
                                    endAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={gaugeColor} />
                                    <Cell fill="#f3f4f6" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pt-4">
                            <span className="text-lg font-bold">{score}</span>
                        </div>
                    </div>

                    <div className="text-right space-y-1">
                        <Badge className={`${riskColor} hover:${riskColor} text-white border-0`}>
                            {riskLevel}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            Internal Score: {riskScore || "N/A"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
