"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RiHammerLine } from "react-icons/ri";
import { createLegalCase } from "@/app/actions/legal";

const formSchema = z.object({
    caseNumber: z.string().min(1, "Case number is required"),
    courtName: z.string().min(1, "Court name is required"),
    caseType: z.string().min(1, "Case type is required"),
    loanId: z.string().min(1, "Loan ID is required"),
    filingDate: z.string().min(1, "Filing date is required"),
    claimAmount: z.coerce.number().min(0, "Claim amount must be positive"),
    notes: z.string().optional(),
    status: z.enum(["FILED", "HEARING_SCHEDULED", "ORDER_PASSED", "CLOSED"]),
});

export function AddCaseDialog({ loans }: { loans: { id: string; loanNumber: string }[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            caseNumber: "",
            courtName: "",
            caseType: "CIVIL_SUIT",
            loanId: "",
            filingDate: new Date().toISOString().split("T")[0],
            claimAmount: 0,
            notes: "",
            status: "FILED",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(() => {
            createLegalCase(values)
                .then((result) => {
                    if (result.success) {
                        toast.success("Legal case created successfully");
                        setOpen(false);
                        form.reset();
                    } else {
                        toast.error(result.error || "Failed to create legal case");
                    }
                })
                .catch(() => toast.error("Something went wrong"));
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <RiHammerLine className="h-4 w-4" />
                    New Case Noting
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Legal Case</DialogTitle>
                    <DialogDescription>
                        Record a new legal case or noting for a loan account
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="caseNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Case Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CS/2024/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="loanId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loan Account</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Loan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {loans.map((loan) => (
                                                    <SelectItem key={loan.id} value={loan.id}>
                                                        {loan.loanNumber}
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
                                name="courtName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Court/Forum</FormLabel>
                                        <FormControl>
                                            <Input placeholder="High Court..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="caseType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Case Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CIVIL_SUIT">Civil Suit</SelectItem>
                                                <SelectItem value="ARBITRATION">Arbitration</SelectItem>
                                                <SelectItem value="DRT">DRT</SelectItem>
                                                <SelectItem value="SARFAESI">SARFAESI</SelectItem>
                                                <SelectItem value="CRIMINAL">Criminal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="filingDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Filing Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="claimAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Claim Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FILED">Filed</SelectItem>
                                                <SelectItem value="HEARING_SCHEDULED">Hearing Scheduled</SelectItem>
                                                <SelectItem value="ORDER_PASSED">Order Passed</SelectItem>
                                                <SelectItem value="CLOSED">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Details about the case..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Creating..." : "Create Case"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
