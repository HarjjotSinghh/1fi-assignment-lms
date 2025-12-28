"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    RiMoneyDollarCircleLine,
    RiPercentLine,
    RiCalendarLine,
    RiInformationLine,
    RiCheckboxCircleLine,
    RiCalculatorLine,
} from "react-icons/ri";

interface ForeclosureBreakdown {
    outstandingPrincipal: number;
    outstandingInterest: number;
    foreclosureChargesPercent: number;
    foreclosureCharges: number;
    penalInterest: number;
    processingFee: number;
    gstOnCharges: number;
    totalPayable: number;
    savings: number;
    savingsPercent: number;
}

export function ForeclosureCalculator() {
    // Loan inputs
    const [principalAmount, setPrincipalAmount] = useState(500000);
    const [interestRate, setInterestRate] = useState(10.5);
    const [tenureMonths, setTenureMonths] = useState(24);
    const [paidEmis, setPaidEmis] = useState(6);

    // Foreclosure parameters
    const [foreclosureChargePercent, setForeclosureChargePercent] = useState(4);
    const [penalInterestDays, setPenalInterestDays] = useState(0);
    const [includeSgst, setIncludeSgst] = useState(true);

    // Calculated values
    const breakdown = useMemo((): ForeclosureBreakdown => {
        const monthlyRate = interestRate / 12 / 100;

        // Calculate EMI
        const emi = (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
            (Math.pow(1 + monthlyRate, tenureMonths) - 1);

        // Calculate outstanding after N EMIs paid
        let remainingPrincipal = principalAmount;
        let totalInterestPaid = 0;

        for (let i = 0; i < paidEmis; i++) {
            const interestForMonth = remainingPrincipal * monthlyRate;
            const principalForMonth = emi - interestForMonth;
            remainingPrincipal -= principalForMonth;
            totalInterestPaid += interestForMonth;
        }

        // Outstanding interest for current period (assume mid-month)
        const outstandingInterest = remainingPrincipal * monthlyRate * 0.5;

        // Foreclosure charges
        const foreclosureCharges = remainingPrincipal * (foreclosureChargePercent / 100);

        // Penal interest (if any)
        const dailyRate = interestRate / 365 / 100;
        const penalInterest = remainingPrincipal * dailyRate * penalInterestDays * 2; // 2x penal rate

        // Processing fee (flat)
        const processingFee = 500;

        // GST on charges (18%)
        const gstOnCharges = includeSgst ? (foreclosureCharges + processingFee) * 0.18 : 0;

        // Total payable
        const totalPayable = remainingPrincipal + outstandingInterest + foreclosureCharges +
            penalInterest + processingFee + gstOnCharges;

        // Without foreclosure - remaining EMIs
        const remainingEmis = tenureMonths - paidEmis;
        const totalWithoutForeclosure = emi * remainingEmis;

        // Savings
        const savings = Math.max(0, totalWithoutForeclosure - totalPayable);
        const savingsPercent = (savings / totalWithoutForeclosure) * 100;

        return {
            outstandingPrincipal: Math.round(remainingPrincipal),
            outstandingInterest: Math.round(outstandingInterest),
            foreclosureChargesPercent: foreclosureChargePercent,
            foreclosureCharges: Math.round(foreclosureCharges),
            penalInterest: Math.round(penalInterest),
            processingFee,
            gstOnCharges: Math.round(gstOnCharges),
            totalPayable: Math.round(totalPayable),
            savings: Math.round(savings),
            savingsPercent: Math.round(savingsPercent * 10) / 10,
        };
    }, [principalAmount, interestRate, tenureMonths, paidEmis, foreclosureChargePercent, penalInterestDays, includeSgst]);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RiCalculatorLine className="h-5 w-5" />
                        Loan Details
                    </CardTitle>
                    <CardDescription>
                        Enter loan parameters to simulate foreclosure
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Principal Amount */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                                <RiMoneyDollarCircleLine className="h-4 w-4 text-primary" />
                                Principal Amount
                            </Label>
                            <span className="font-bold text-lg">₹ {principalAmount.toLocaleString()}</span>
                        </div>
                        <Slider
                            value={[principalAmount]}
                            min={50000}
                            max={10000000}
                            step={10000}
                            onValueChange={(v) => setPrincipalAmount(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₹50K</span>
                            <span>₹1 Cr</span>
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                                <RiPercentLine className="h-4 w-4 text-warning" />
                                Interest Rate (p.a.)
                            </Label>
                            <span className="font-bold text-lg">{interestRate}%</span>
                        </div>
                        <Slider
                            value={[interestRate]}
                            min={5}
                            max={25}
                            step={0.1}
                            onValueChange={(v) => setInterestRate(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>5%</span>
                            <span>25%</span>
                        </div>
                    </div>

                    {/* Tenure */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                                <RiCalendarLine className="h-4 w-4 text-success" />
                                Loan Tenure
                            </Label>
                            <span className="font-bold text-lg">{tenureMonths} months</span>
                        </div>
                        <Slider
                            value={[tenureMonths]}
                            min={6}
                            max={120}
                            step={1}
                            onValueChange={(v) => setTenureMonths(v[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>6 months</span>
                            <span>10 years</span>
                        </div>
                    </div>

                    {/* EMIs Paid */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>EMIs Already Paid</Label>
                            <span className="font-bold text-lg">{paidEmis} of {tenureMonths}</span>
                        </div>
                        <Slider
                            value={[paidEmis]}
                            min={0}
                            max={tenureMonths - 1}
                            step={1}
                            onValueChange={(v) => setPaidEmis(v[0])}
                            className="py-2"
                        />
                    </div>

                    <Separator />

                    {/* Foreclosure Parameters */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Foreclosure Charges</h4>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Foreclosure Charge %</Label>
                                <span className="font-medium">{foreclosureChargePercent}%</span>
                            </div>
                            <Slider
                                value={[foreclosureChargePercent]}
                                min={0}
                                max={10}
                                step={0.5}
                                onValueChange={(v) => setForeclosureChargePercent(v[0])}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Penal Interest Days (Overdue)</Label>
                                <span className="font-medium">{penalInterestDays} days</span>
                            </div>
                            <Slider
                                value={[penalInterestDays]}
                                min={0}
                                max={90}
                                step={1}
                                onValueChange={(v) => setPenalInterestDays(v[0])}
                                className="py-2"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="gst-toggle">Include GST (18%) on Charges</Label>
                            <Button
                                variant={includeSgst ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIncludeSgst(!includeSgst)}
                            >
                                {includeSgst ? "Yes" : "No"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
                {/* Summary Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Total Settlement Amount</span>
                            {breakdown.savings > 0 && (
                                <Badge className="bg-success/10 text-success border-success/20">
                                    <RiCheckboxCircleLine className="h-3 w-3 mr-1" />
                                    Save {breakdown.savingsPercent}%
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary mb-4">
                            ₹ {breakdown.totalPayable.toLocaleString()}
                        </div>
                        {breakdown.savings > 0 && (
                            <p className="text-sm text-muted-foreground">
                                You save <span className="text-success font-medium">₹{breakdown.savings.toLocaleString()}</span> compared to paying remaining EMIs
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Foreclosure Breakdown</CardTitle>
                        <CardDescription>Detailed charges and calculations</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Outstanding Principal</TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                        ₹ {breakdown.outstandingPrincipal.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Outstanding Interest (Accrued)</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ₹ {breakdown.outstandingInterest.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Foreclosure Charges ({breakdown.foreclosureChargesPercent}%)
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-warning">
                                        + ₹ {breakdown.foreclosureCharges.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                                {breakdown.penalInterest > 0 && (
                                    <TableRow>
                                        <TableCell className="text-muted-foreground">Penal Interest</TableCell>
                                        <TableCell className="text-right font-mono text-destructive">
                                            + ₹ {breakdown.penalInterest.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Processing Fee</TableCell>
                                    <TableCell className="text-right font-mono">
                                        + ₹ {breakdown.processingFee.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                                {breakdown.gstOnCharges > 0 && (
                                    <TableRow>
                                        <TableCell className="text-muted-foreground">GST (18%)</TableCell>
                                        <TableCell className="text-right font-mono">
                                            + ₹ {breakdown.gstOnCharges.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="border-t-2 bg-muted/30">
                                    <TableCell className="font-bold">Total Payable</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-lg">
                                        ₹ {breakdown.totalPayable.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Disclaimer */}
                <Card className="border-info/20 bg-info/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <RiInformationLine className="h-5 w-5 text-info shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-foreground mb-1">Note</p>
                                <p>
                                    This is a simulation tool. Actual foreclosure amounts may vary based on
                                    your loan agreement terms, current RBI guidelines, and lender-specific policies.
                                    Contact your relationship manager for exact figures.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
