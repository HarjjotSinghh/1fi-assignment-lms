"use client";

import { useState } from "react";
import {
    RiCalculatorLine,
    RiLoader4Line,
    RiMoneyDollarCircleLine,
    RiUserLine,
    RiCalendarLine,
    RiPrinterLine,
    RiFileWarningLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";

interface ForeclosureResult {
    loanId: string;
    loanNumber: string;
    customerName: string;
    outstandingPrincipal: number;
    outstandingInterest: number;
    accruedInterest: number;
    penaltyAmount: number;
    gstOnPenalty: number;
    totalPayable: number;
    foreclosureDate: string;
    daysSinceLastPayment: number;
}

export default function ForeclosureCalculatorPage() {
    const [loanNumber, setLoanNumber] = useState("");
    const [foreclosureDate, setForeclosureDate] = useState(new Date().toISOString().split("T")[0]);
    const [result, setResult] = useState<ForeclosureResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculate = async () => {
        if (!loanNumber) {
            toast.error("Please enter a loan number");
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                loanNumber,
                date: foreclosureDate,
            });

            const response = await fetch(`/api/tools/foreclosure?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setResult(data);
                toast.success("Calculation complete");
            } else {
                toast.error(data.error || "Failed to calculate");
                setResult(null);
            }
        } catch {
            toast.error("An error occurred during calculation");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Foreclosure Calculator</h1>
                    <p className="text-muted-foreground">
                        Calculate final settlement amount for loan closure
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Calculation Parameters</CardTitle>
                        <CardDescription>
                            Enter loan details to check foreclosure amount
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="loanNumber">Loan Account Number</Label>
                            <Input
                                id="loanNumber"
                                placeholder="e.g. LOAN-1234..."
                                value={loanNumber}
                                onChange={(e) => setLoanNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Foreclosure Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={foreclosureDate}
                                onChange={(e) => setForeclosureDate(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={handleCalculate}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RiCalculatorLine className="mr-2 h-4 w-4" />
                            )}
                            Calculate Amount
                        </Button>
                    </CardFooter>
                </Card>

                <Card className={result ? "border-primary/20 bg-primary/5" : "bg-muted/30"}>
                    <CardHeader>
                        <CardTitle>Estimation Result</CardTitle>
                        <CardDescription>
                            {result ? `Quote for ${result.customerName}` : "Results will appear here"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-background rounded-lg border space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Reference</span>
                                        <span className="font-mono">{result.loanNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Date</span>
                                        <span>{format(new Date(result.foreclosureDate), "PP")}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Principal Outstanding</span>
                                        <span className="font-medium">{formatCurrency(result.outstandingPrincipal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Interest Outstanding (Arrears)</span>
                                        <span className="font-medium">{formatCurrency(result.outstandingInterest)}</span>
                                    </div>
                                    <div className="flex justify-between text-orange-600">
                                        <span>Accrued Interest ({result.daysSinceLastPayment} days)</span>
                                        <span className="font-medium">{formatCurrency(result.accruedInterest)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Foreclosure Charges</span>
                                        <span className="font-medium">{formatCurrency(result.penaltyAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>GST on Charges (18%)</span>
                                        <span className="font-medium">{formatCurrency(result.gstOnPenalty)}</span>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Payable</span>
                                        <span className="text-primary">{formatCurrency(result.totalPayable)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                                <RiMoneyDollarCircleLine className="h-12 w-12 mb-2 opacity-20" />
                                <p>Enter details to estimate</p>
                            </div>
                        )}
                    </CardContent>
                    {result && (
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" className="w-full">
                                <RiPrinterLine className="mr-2 h-4 w-4" />
                                Print Quote
                            </Button>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <RiFileWarningLine className="mr-2 h-4 w-4" />
                                Initiate Closure
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
