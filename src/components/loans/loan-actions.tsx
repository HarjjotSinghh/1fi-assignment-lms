"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    RiAddLine,
    RiLoader4Line,
    RiMoneyDollarCircleLine,
    RiAlertLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { recordPaymentAction } from "@/app/actions/payments";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const paymentFormSchema = z.object({
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    paymentDate: z.string().min(1, "Date is required"),
    paymentMode: z.string().min(1, "Mode is required"),
    transactionRef: z.string().optional(),
});

type RecordPaymentDialogProps = {
    loanId: string;
    totalOutstanding: number;
    emiAmount: number;
};

export function RecordPaymentDialog({ loanId, totalOutstanding, emiAmount }: RecordPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm({
        resolver: zodResolver(paymentFormSchema) as any,
        defaultValues: {
            amount: emiAmount,
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMode: "UPI",
            transactionRef: "",
        },
    });

    function onSubmit(values: any) {
        startTransition(async () => {
            const result = await recordPaymentAction({
                loanId,
                amount: values.amount,
                paymentDate: values.paymentDate,
                paymentMode: values.paymentMode,
                transactionRef: values.transactionRef,
            });

            if (result.success) {
                toast.success("Payment recorded successfully");
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Failed to record payment");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-none gap-2">
                    <RiAddLine className="h-4 w-4" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Manual Payment</DialogTitle>
                    <DialogDescription>
                        Enter details of the payment received.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="paymentDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="paymentMode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mode</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select mode" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CASH">Cash</SelectItem>
                                            <SelectItem value="UPI">UPI</SelectItem>
                                            <SelectItem value="NEFT">NEFT/IMPS</SelectItem>
                                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="transactionRef"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reference (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Txn ID / Cheque No" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />}
                                Record Payment
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function ForeclosureDialog({ loanId, totalOutstanding }: { loanId: string; totalOutstanding: number }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-none gap-2 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                    <RiAlertLine className="h-4 w-4" />
                    Foreclose Loan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Foreclose Loan</DialogTitle>
                    <DialogDescription>
                        Simulate foreclosure charges and final settlement amount.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal Outstanding</span>
                        <span className="font-mono">{formatCurrency(totalOutstanding)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Foreclosure Charges (4%)</span>
                        <span className="font-mono">{formatCurrency(totalOutstanding * 0.04)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total Payable</span>
                        <span>{formatCurrency(totalOutstanding * 1.04)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" disabled>Execute Foreclosure (Coming Soon)</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
