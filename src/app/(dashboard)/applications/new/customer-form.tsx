"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  RiUserLine,
  RiShieldCheckLine,
  RiMapPinLine,
  RiBriefcaseLine,
  RiBankCardLine,
  RiFileListLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiLoader4Line,
  RiCheckLine,
  RiAlertLine,
} from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { validatePhone, formatCurrency } from "@/lib/utils";
import { KycVerificationCard } from "@/components/kyc/kyc-verification-card";
import type { LoanProduct } from "@/db/schema";

const customerSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(validatePhone, "Invalid phone number (10 digits starting with 6-9)"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  
  // Address
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode (6 digits)"),
  
  // Employment
  employmentType: z.enum(["SALARIED", "SELF_EMPLOYED", "BUSINESS"]),
  monthlyIncome: z.coerce.number().min(10000, "Minimum income should be ₹10,000"),
  companyName: z.string().optional(),
  
  // Bank Details
  bankAccountNumber: z.string().min(8, "Bank account number is required"),
  bankIfscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  bankName: z.string().min(2, "Bank name is required"),
  
  // Loan Details
  productId: z.string().min(1, "Select a loan product"),
  requestedAmount: z.coerce.number().min(10000, "Minimum loan amount is ₹10,000"),
  tenure: z.coerce.number().min(1, "Tenure is required"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const steps = [
  { id: "personal", title: "Personal Info", icon: RiUserLine },
  { id: "kyc", title: "KYC Verification", icon: RiShieldCheckLine },
  { id: "address", title: "Address", icon: RiMapPinLine },
  { id: "employment", title: "Employment", icon: RiBriefcaseLine },
  { id: "bank", title: "Bank Details", icon: RiBankCardLine },
  { id: "loan", title: "Loan Details", icon: RiFileListLine },
];

export function CustomerOnboardingForm({ products }: { products: LoanProduct[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for KYC status from redirect
  useEffect(() => {
    const kycStatus = searchParams.get("kyc_status");
    if (kycStatus === "AUTHENTICATED") {
      setKycVerified(true);
      toast.success("KYC verification completed!", {
        description: "Your Aadhaar and PAN have been verified.",
      });
    }
  }, [searchParams]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      employmentType: "SALARIED",
      monthlyIncome: 0,
      companyName: "",
      bankAccountNumber: "",
      bankIfscCode: "",
      bankName: "",
      productId: "",
      requestedAmount: 100000,
      tenure: 12,
    },
  });

  const selectedProduct = products.find((p) => p.id === form.watch("productId"));

  const handleKycComplete = (status: string) => {
    if (status === "AUTHENTICATED") {
      setKycVerified(true);
    }
  };

  const nextStep = async () => {
    // KYC step doesn't have form fields to validate
    if (currentStep === 1) {
      if (!kycVerified) {
        toast.error("KYC verification required", {
          description: "Please verify your Aadhaar and PAN via DigiLocker before proceeding.",
        });
        return;
      }
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    const fieldsToValidate = getFieldsForStep(currentStep);
    const result = await form.trigger(fieldsToValidate as any);
    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): (keyof CustomerFormData)[] => {
    switch (step) {
      case 0: return ["firstName", "lastName", "email", "phone", "dateOfBirth"];
      case 1: return []; // KYC via DigiLocker - no form fields
      case 2: return ["addressLine1", "city", "state", "pincode"];
      case 3: return ["employmentType", "monthlyIncome"];
      case 4: return ["bankAccountNumber", "bankIfscCode", "bankName"];
      case 5: return ["productId", "requestedAmount", "tenure"];
      default: return [];
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!kycVerified) {
      toast.error("KYC verification required", {
        description: "Please verify your Aadhaar and PAN via DigiLocker before submitting.",
      });
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          kycVerified: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create application");

      toast.success("Application submitted successfully!", {
        description: "The loan application is now under review.",
      });
      router.push("/applications");
    } catch (error) {
      toast.error("Failed to submit application", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps with Icons */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => index < currentStep && setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <RiCheckLine className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
                <span className="font-medium text-sm hidden lg:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-6 lg:w-12 h-0.5 mx-1 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <Card className="border">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6 }}
            >
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  {(() => {
                    const StepIcon = steps[currentStep].icon;
                    return <StepIcon className="h-5 w-5 text-primary" />;
                  })()}
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {steps.length}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Step 0: Personal Info */}
                {currentStep === 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" placeholder="John" {...form.register("firstName")} />
                      {form.formState.errors.firstName && (
                        <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Doe" {...form.register("lastName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" placeholder="john@example.com" {...form.register("email")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" placeholder="9876543210" {...form.register("phone")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
                    </div>
                  </div>
                )}

                {/* Step 1: KYC */}
                {currentStep === 1 && (
                  <KycVerificationCard
                    mode="required"
                    aadhaarVerified={kycVerified}
                    panVerified={kycVerified}
                    kycStatus={kycVerified ? "VERIFIED" : "PENDING"}
                    onVerificationComplete={handleKycComplete}
                  />
                )}

                {/* Step 2: Address */}
                {currentStep === 2 && (
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input id="addressLine1" placeholder="House/Flat No, Street" {...form.register("addressLine1")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input id="addressLine2" placeholder="Landmark, Area" {...form.register("addressLine2")} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" placeholder="Mumbai" {...form.register("city")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input id="state" placeholder="Maharashtra" {...form.register("state")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input id="pincode" placeholder="400001" {...form.register("pincode")} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Employment */}
                {currentStep === 3 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type *</Label>
                      <Select
                        value={form.watch("employmentType")}
                        onValueChange={(value) => form.setValue("employmentType", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SALARIED">Salaried</SelectItem>
                          <SelectItem value="SELF_EMPLOYED">Self Employed</SelectItem>
                          <SelectItem value="BUSINESS">Business Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">Monthly Income (₹) *</Label>
                      <Input id="monthlyIncome" type="number" placeholder="50000" {...form.register("monthlyIncome")} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="companyName">Company / Business Name</Label>
                      <Input id="companyName" placeholder="ABC Pvt Ltd" {...form.register("companyName")} />
                    </div>
                  </div>
                )}

                {/* Step 4: Bank Details */}
                {currentStep === 4 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input id="bankName" placeholder="HDFC Bank" {...form.register("bankName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankIfscCode">IFSC Code *</Label>
                      <Input id="bankIfscCode" placeholder="HDFC0001234" className="uppercase" {...form.register("bankIfscCode")} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="bankAccountNumber">Account Number *</Label>
                      <Input id="bankAccountNumber" placeholder="1234567890123456" {...form.register("bankAccountNumber")} />
                    </div>
                  </div>
                )}

                {/* Step 5: Loan Details */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="productId">Loan Product *</Label>
                        <Select
                          value={form.watch("productId")}
                          onValueChange={(value) => form.setValue("productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a loan product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{product.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    @ {product.interestRatePercent}% p.a.
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requestedAmount">Loan Amount (₹) *</Label>
                        <Input id="requestedAmount" type="number" placeholder="100000" {...form.register("requestedAmount")} />
                        {selectedProduct && (
                          <p className="text-xs text-muted-foreground">
                            Range: {formatCurrency(selectedProduct.minAmount)} - {formatCurrency(selectedProduct.maxAmount)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenure">Tenure (Months) *</Label>
                        <Input id="tenure" type="number" placeholder="12" {...form.register("tenure")} />
                        {selectedProduct && (
                          <p className="text-xs text-muted-foreground">
                            Range: {selectedProduct.minTenureMonths} - {selectedProduct.maxTenureMonths} months
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 border">
                        <h4 className="font-medium text-sm mb-3">Loan Summary</h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Product</span>
                            <span className="font-medium">{selectedProduct.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Rate</span>
                            <span className="font-mono">{selectedProduct.interestRatePercent}% p.a.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max LTV</span>
                            <span className="font-mono">{selectedProduct.maxLtvPercent}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <Separator />
          <div className="flex items-center justify-between p-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <RiArrowLeftLine className="h-4 w-4" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button type="submit" disabled={isLoading} className="gap-2 press-scale">
                {isLoading && <RiLoader4Line className="h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            ) : (
              <Button type="button" onClick={nextStep} className="gap-2 press-scale">
                Next
                <RiArrowRightLine className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
