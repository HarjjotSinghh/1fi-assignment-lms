"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiLoader4Line } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  minAmount: z.coerce.number().min(10000, "Minimum amount must be at least ₹10,000"),
  maxAmount: z.coerce.number().min(10000, "Maximum amount must be at least ₹10,000"),
  minTenureMonths: z.coerce.number().min(1, "Minimum tenure must be at least 1 month"),
  maxTenureMonths: z.coerce.number().min(1, "Maximum tenure must be at least 1 month"),
  interestRatePercent: z.coerce.number().min(0.1, "Interest rate must be at least 0.1%").max(36, "Interest rate cannot exceed 36%"),
  processingFeePercent: z.coerce.number().min(0, "Processing fee cannot be negative").max(10, "Processing fee cannot exceed 10%"),
  maxLtvPercent: z.coerce.number().min(10, "Max LTV must be at least 10%").max(80, "Max LTV cannot exceed 80%"),
  marginCallThreshold: z.coerce.number().min(10, "Threshold must be at least 10%").max(90, "Threshold cannot exceed 90%"),
  liquidationThreshold: z.coerce.number().min(10, "Threshold must be at least 10%").max(95, "Threshold cannot exceed 95%"),
  minCreditScore: z.coerce.number().optional(),
  minMonthlyIncome: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductFormDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      minAmount: 50000,
      maxAmount: 1000000,
      minTenureMonths: 3,
      maxTenureMonths: 36,
      interestRatePercent: 10.5,
      processingFeePercent: 1,
      maxLtvPercent: 50,
      marginCallThreshold: 60,
      liquidationThreshold: 70,
      isActive: true,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      toast.success("Product created successfully", {
        description: `${data.name} has been added to your loan products.`,
      });
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to create product", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 press-scale">
          <RiAddLine className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Create Loan Product</DialogTitle>
          <DialogDescription>
            Define a new loan product with interest rates, tenure, and LTV settings for LAMF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., LAMF Standard"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2 flex items-center justify-between pt-6">
                <Label htmlFor="isActive">Active Product</Label>
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe this loan product..."
                rows={3}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Loan Amount Range (₹)</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minAmount" className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="50,000"
                  {...form.register("minAmount")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount" className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="10,00,000"
                  {...form.register("maxAmount")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Tenure Range (Months)</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minTenureMonths" className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  id="minTenureMonths"
                  type="number"
                  placeholder="3"
                  {...form.register("minTenureMonths")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTenureMonths" className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  id="maxTenureMonths"
                  type="number"
                  placeholder="36"
                  {...form.register("maxTenureMonths")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Interest & Fees (%)</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interestRatePercent" className="text-xs text-muted-foreground">Interest Rate (p.a.)</Label>
                <Input
                  id="interestRatePercent"
                  type="number"
                  step="0.01"
                  placeholder="10.5"
                  {...form.register("interestRatePercent")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="processingFeePercent" className="text-xs text-muted-foreground">Processing Fee</Label>
                <Input
                  id="processingFeePercent"
                  type="number"
                  step="0.01"
                  placeholder="1.0"
                  {...form.register("processingFeePercent")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium text-sm">LTV Settings (Loan-to-Value)</h4>
            <p className="text-xs text-muted-foreground">Configure collateral thresholds for margin calls and liquidation.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxLtvPercent" className="text-xs text-muted-foreground">Max LTV</Label>
                <Input
                  id="maxLtvPercent"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  {...form.register("maxLtvPercent")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginCallThreshold" className="text-xs text-muted-foreground">Margin Call At</Label>
                <Input
                  id="marginCallThreshold"
                  type="number"
                  step="0.1"
                  placeholder="60"
                  {...form.register("marginCallThreshold")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="liquidationThreshold" className="text-xs text-muted-foreground">Liquidate At</Label>
                <Input
                  id="liquidationThreshold"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  {...form.register("liquidationThreshold")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="press-scale">
              {isLoading && <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
