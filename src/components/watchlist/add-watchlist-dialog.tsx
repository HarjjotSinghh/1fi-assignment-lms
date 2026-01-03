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
import { RiUserForbidLine } from "react-icons/ri";
import { createWatchlistEntry } from "@/app/actions/watchlist";

const formSchema = z.object({
    entityType: z.string().min(1, "Entity type is required"),
    entityValue: z.string().min(1, "Value is required"),
    listType: z.string().min(1, "List type is required"),
    reason: z.string().min(1, "Reason is required"),
});

export function AddWatchlistDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            entityType: "PAN",
            entityValue: "",
            listType: "BLACKLIST",
            reason: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(() => {
            createWatchlistEntry(values)
                .then((result) => {
                    if (result.success) {
                        toast.success("Added to watchlist");
                        setOpen(false);
                        form.reset();
                    } else {
                        toast.error(result.error || "Failed to add to watchlist");
                    }
                })
                .catch(() => toast.error("Something went wrong"));
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    <RiUserForbidLine className="h-4 w-4" />
                    Add to Watchlist
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add to Watchlist</DialogTitle>
                    <DialogDescription>
                        Add an entity to the blacklist or greylist for monitoring.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="entityType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Entity Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PAN">PAN</SelectItem>
                                            <SelectItem value="AADHAAR">Aadhaar</SelectItem>
                                            <SelectItem value="PHONE">Phone Number</SelectItem>
                                            <SelectItem value="EMAIL">Email</SelectItem>
                                            <SelectItem value="NAME">Name</SelectItem>
                                            <SelectItem value="CUSTOMER">Customer ID</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="entityValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Value</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter PAN, Name or ID..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="listType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>List Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select List" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BLACKLIST">Blacklist (High Risk)</SelectItem>
                                            <SelectItem value="GREYLIST">Greylist (Watch)</SelectItem>
                                            <SelectItem value="WATCHLIST">Watchlist (General)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Why is this entity being listed?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending} variant="destructive">
                                {isPending ? "Adding..." : "Add to Watchlist"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
