"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function EMICalculator() {
    const [amount, setAmount] = useState(500000);
    const [rate, setRate] = useState(10.5);
    const [tenure, setTenure] = useState(24);
    const [emi, setEmi] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const r = rate / 12 / 100;
        const n = tenure;

        // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
        const emiValue = amount * r * (Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
        const totalPayment = emiValue * n;

        setEmi(Math.round(emiValue));
        setTotalAmount(Math.round(totalPayment));
        setTotalInterest(Math.round(totalPayment - amount));
    }, [amount, rate, tenure]);

    const data = [
        { name: "Principal", value: amount },
        { name: "Interest", value: totalInterest },
    ];

    const COLORS = ["#10b981", "#f59e0b"]; // Emerald-500, Amber-500

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>EMI Calculator</CardTitle>
                    <CardDescription>Adjust the sliders to estimate your monthly payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Loan Amount</Label>
                            <span className="font-bold">₹ {amount.toLocaleString()}</span>
                        </div>
                        <Slider
                            value={[amount]}
                            min={10000}
                            max={5000000}
                            step={10000}
                            onValueChange={(v) => setAmount(v[0])}
                            className="py-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Interest Rate (% p.a)</Label>
                            <span className="font-bold">{rate}%</span>
                        </div>
                        <Slider
                            value={[rate]}
                            min={5}
                            max={30}
                            step={0.1}
                            onValueChange={(v) => setRate(v[0])}
                            className="py-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Tenure (Months)</Label>
                            <span className="font-bold">{tenure} Months</span>
                        </div>
                        <Slider
                            value={[tenure]}
                            min={3}
                            max={120}
                            step={1}
                            onValueChange={(v) => setTenure(v[0])}
                            className="py-2"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Repayment Details</CardTitle>
                    <CardDescription>Breakdown of your loan repayment</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`₹ ${value.toLocaleString()}`, "Amount"]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Monthly EMI</span>
                            <span className="text-xl font-bold text-primary">₹ {emi.toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Total Interest</Label>
                                <div className="font-semibold text-amber-500">₹ {totalInterest.toLocaleString()}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Total Amount</Label>
                                <div className="font-semibold">₹ {totalAmount.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
