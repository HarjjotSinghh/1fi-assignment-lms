"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ForeclosureSimulationProps {
    loanId: string;
    principalOutstanding: number;
    interestRate: number; // yearly
    daysSinceLastPayment?: number;
}

export function ForeclosureSimulation({ loanId, principalOutstanding, interestRate, daysSinceLastPayment = 15 }: ForeclosureSimulationProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Calculations
    const interestPending = Math.round((principalOutstanding * (interestRate / 100) * daysSinceLastPayment) / 365);
    const foreclosureChargesPercent = 0.04; // 4%
    const foreclosureCharges = Math.round(principalOutstanding * foreclosureChargesPercent);
    const gstOnCharges = Math.round(foreclosureCharges * 0.18);
    const totalForeclosureAmount = principalOutstanding + interestPending + foreclosureCharges + gstOnCharges;

    function handleSimulate() {
        setIsOpen(true);
    }

    function handleInitiateForeclosure() {
        toast.info("Foreclosure request initiated. Sent for approval.");
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" onClick={handleSimulate}>Simulate Foreclosure</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Foreclosure Simulation</DialogTitle>
                    <DialogDescription>
                        Estimate the total amount required to close this loan today.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 items-center gap-4">
                        <Label>Principal Outstanding</Label>
                        <div className="text-right font-medium">₹ {principalOutstanding.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4 text-muted-foreground">
                        <Label>Interest Pending ({daysSinceLastPayment} days)</Label>
                        <div className="text-right">₹ {interestPending.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4 text-muted-foreground">
                        <Label>Foreclosure Charges (4%)</Label>
                        <div className="text-right">₹ {foreclosureCharges.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4 text-muted-foreground border-b pb-4">
                        <Label>GST (18% on Charges)</Label>
                        <div className="text-right">₹ {gstOnCharges.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                        <Label className="font-bold text-lg">Total Payable</Label>
                        <div className="text-right font-bold text-lg text-primary">₹ {totalForeclosureAmount.toLocaleString()}</div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleInitiateForeclosure}>Initiate Foreclosure</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
