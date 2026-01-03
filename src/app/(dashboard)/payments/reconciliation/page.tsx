"use client";

import { useEffect, useState } from "react";
import { 
    RiBankLine, 
    RiCheckDoubleLine, 
    RiCloseLine,
    RiLoader4Line,
    RiFilterLine,
    RiMoneyDollarBoxLine,
    RiCheckboxCircleLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payment {
    id: string;
    amount: number;
    date: string;
    mode: string;
    reference: string | null;
    status: string;
    isReconciled: boolean;
    reconciliationNotes: string | null;
    reconciledAt: string | null;
    loanNumber: string;
    customerName: string;
    customerEmail: string;
}

export default function ReconciliationPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("false"); // "all", "true", "false"
    
    // Dialog state
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const loadPayments = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== "all") params.set("reconciled", filter);
            
            const response = await fetch(`/api/payments/reconciliation?${params.toString()}`);
            const data = await response.json();
            
            if (response.ok) {
                setPayments(data.payments);
            } else {
                toast.error(data.error || "Failed to load payments");
            }
        } catch {
            toast.error("Failed to load payments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, [filter]);

    const handleReconcile = async () => {
        if (!selectedPayment) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/payments/reconciliation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId: selectedPayment.id,
                    notes,
                    action: "reconcile",
                }),
            });

            if (response.ok) {
                toast.success("Payment reconciled successfully");
                setDialogOpen(false);
                loadPayments();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to reconcile");
            }
        } catch {
            toast.error("Failed to reconcile payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openReconcileDialog = (payment: Payment) => {
        setSelectedPayment(payment);
        setNotes("");
        setDialogOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h1>
                    <p className="text-muted-foreground">
                        Match and verify received payments against bank records
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="false">Unreconciled</SelectItem>
                            <SelectItem value="true">Reconciled</SelectItem>
                            <SelectItem value="all">All Payments</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => loadPayments()}>
                        <RiFilterLine className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                        {payments.length} payment{payments.length !== 1 ? "s" : ""} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RiBankLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No payments found matching criteria</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Mode/Ref</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reconciled</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="font-medium">{format(new Date(payment.date), "PP")}</div>
                                            <div className="text-xs text-muted-foreground">{format(new Date(payment.date), "p")}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{payment.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{payment.loanNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold">{formatCurrency(payment.amount)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <RiMoneyDollarBoxLine className="h-4 w-4 text-muted-foreground" />
                                                {payment.mode}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {payment.reference || "No Ref"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={payment.status === "SUCCESS" ? "default" : "destructive"}>
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {payment.isReconciled ? (
                                                <Badge className="bg-green-600 hover:bg-green-700">
                                                    <RiCheckDoubleLine className="h-3 w-3 mr-1" />
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200">
                                                    Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!payment.isReconciled && payment.status === "SUCCESS" && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => openReconcileDialog(payment)}
                                                >
                                                    Reconcile
                                                </Button>
                                            )}
                                            {payment.isReconciled && (
                                                <div className="text-xs text-muted-foreground italic">
                                                    {format(new Date(payment.reconciledAt!), "PP")}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reconcile Payment</DialogTitle>
                        <DialogDescription>
                            Confirm payment receipt and verify against bank records.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-md">
                                <div>
                                    <span className="text-muted-foreground block">Customer</span>
                                    <span className="font-medium">{selectedPayment.customerName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Amount</span>
                                    <span className="font-medium text-lg">{formatCurrency(selectedPayment.amount)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Reference</span>
                                    <span className="font-mono">{selectedPayment.reference || "N/A"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Date</span>
                                    <span>{format(new Date(selectedPayment.date), "PP")}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Reconciliation Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter bank statement reference or other remarks..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReconcile} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                            {isSubmitting && <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />}
                            <RiCheckboxCircleLine className="h-4 w-4 mr-2" />
                            Confirm Match
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
