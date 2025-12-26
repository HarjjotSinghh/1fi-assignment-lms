"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RiArrowRightLine, RiCheckLine, RiMoneyDollarCircleLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createLoanAction } from "@/app/actions/loans";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    productId: z.string().min(1, "Product is required"),
    amount: z.coerce.number().min(1000, "Amount must be at least 1,000"),
    tenure: z.coerce.number().min(3, "Tenure must be at least 3 months"),
    interestRate: z.coerce.number().min(1, "Interest rate is required"),
    disbursementDate: z.string().min(1, "Disbursement date is required"),
});

type LoanWizardProps = {
    customers: { id: string; name: string; email: string }[];
    products: { id: string; name: string; minAmount: number; maxAmount: number; interestRate: number; minTenure: number; maxTenure: number }[];
};

type LoanFormValues = z.infer<typeof formSchema>;

export function LoanWizard({ customers, products }: LoanWizardProps) {
    const [step, setStep] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<LoanWizardProps["products"][0] | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<LoanFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            customerId: "",
            productId: "",
            amount: 0,
            tenure: 12,
            interestRate: 0,
            disbursementDate: new Date().toISOString().split("T")[0],
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const result = await createLoanAction(values);
            if (result.success) {
                toast.success("Loan created successfully");
                router.push(`/loans/${result.loanId}`);
            } else {
                toast.error(result.error || "Failed to create loan");
            }
        });
    }

    const watchedProductId = form.watch("productId");
    if (watchedProductId && selectedProduct?.id !== watchedProductId) {
        const product = products.find((p) => p.id === watchedProductId);
        setSelectedProduct(product || null);
        if (product) {
            form.setValue("interestRate", product.interestRate);
            form.setValue("tenure", Math.max(product.minTenure, 12));
        }
    }

    const amount = form.watch("amount");
    const tenure = form.watch("tenure");
    const interestRate = form.watch("interestRate");

    const monthlyRate = interestRate / 12 / 100;
    const emi = amount * monthlyRate * (Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1) || 0;

    return (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Loan Details</CardTitle>
                        <CardDescription>Enter the loan terms and select the borrower.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a customer" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {customers.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.name} ({c.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="productId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Product</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name} ({p.interestRate}% p.a.)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Principal Amount</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    {selectedProduct ? `Min: ${formatCurrency(selectedProduct.minAmount)} - Max: ${formatCurrency(selectedProduct.maxAmount)}` : "Select a product first"}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tenure"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tenure (Months)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="interestRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Interest Rate (% p.a.)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="disbursementDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Disbursement Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                        <Button onClick={form.handleSubmit(onSubmit)} className="gap-2" disabled={isPending}>
                            {isPending ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : <RiCheckLine className="h-4 w-4" />}
                            Create Loan
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Repayment Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Monthly EMI</span>
                            <span className="text-xl font-bold font-mono text-primary">{formatCurrency(emi)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Interest</span>
                            <span className="font-mono">{formatCurrency((emi * tenure) - amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Payable</span>
                            <span className="font-mono">{formatCurrency(emi * tenure)}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Min Tenure</span>
                                <span>{selectedProduct?.minTenure || "-"} months</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Max Tenure</span>
                                <span>{selectedProduct?.maxTenure || "-"} months</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert>
                    <RiMoneyDollarCircleLine className="h-4 w-4" />
                    <AlertTitle>Disbursement</AlertTitle>
                    <AlertDescription>
                        Funds will be disbursed to the customer's primary bank account ending in ****1234.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
