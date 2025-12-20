"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  CreditCard,
  Briefcase,
  Building,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { validateAadhaar, validatePan, validateEmail, validatePhone, formatCurrency } from "@/lib/utils";
import type { LoanProduct } from "@/db/schema";

const customerSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(validatePhone, "Invalid phone number (10 digits starting with 6-9)"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  
  // KYC
  aadhaarNumber: z.string().refine(validateAadhaar, "Invalid Aadhaar number (12 digits)"),
  panNumber: z.string().refine(validatePan, "Invalid PAN number (format: ABCDE1234F)"),
  
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
  { id: "personal", title: "Personal Info", icon: User },
  { id: "kyc", title: "KYC Verification", icon: Shield },
  { id: "address", title: "Address", icon: Building },
  { id: "employment", title: "Employment", icon: Briefcase },
  { id: "bank", title: "Bank Details", icon: CreditCard },
  { id: "loan", title: "Loan Details", icon: FileText },
];

export function CustomerOnboardingForm({ products }: { products: LoanProduct[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [kycVerifying, setKycVerifying] = useState<"aadhaar" | "pan" | null>(null);
  const [kycStatus, setKycStatus] = useState({ aadhaar: false, pan: false });
  const router = useRouter();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      aadhaarNumber: "",
      panNumber: "",
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

  const verifyKYC = async (type: "aadhaar" | "pan") => {
    setKycVerifying(type);
    // Simulate KYC verification API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setKycStatus((prev) => ({ ...prev, [type]: true }));
    setKycVerifying(null);
    toast.success(`${type === "aadhaar" ? "Aadhaar" : "PAN"} verified successfully!`, {
      description: "KYC verification completed.",
    });
  };

  const nextStep = async () => {
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
      case 1: return ["aadhaarNumber", "panNumber"];
      case 2: return ["addressLine1", "city", "state", "pincode"];
      case 3: return ["employmentType", "monthlyIncome"];
      case 4: return ["bankAccountNumber", "bankIfscCode", "bankName"];
      case 5: return ["productId", "requestedAmount", "tenure"];
      default: return [];
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!kycStatus.aadhaar || !kycStatus.pan) {
      toast.error("KYC verification required", {
        description: "Please verify both Aadhaar and PAN before submitting.",
      });
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={`flex items-center gap-2 px-3 py-2 transition-all ${
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : index < currentStep
                  ? "bg-success/10 text-success cursor-pointer hover:bg-success/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="font-medium text-sm hidden md:inline">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`w-8 lg:w-16 h-0.5 mx-1 ${
                index < currentStep ? "bg-success" : "bg-border"
              }`} />
            )}
          </div>
        ))}
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
              transition={{ duration: 0.2 }}
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
                  <div className="space-y-6">
                    <div className="p-4 bg-warning/10 border border-warning/20">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">KYC Verification Required</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enter your Aadhaar and PAN details, then verify each to proceed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                          {kycStatus.aadhaar && (
                            <Badge className="bg-success/10 text-success border-success/20 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="aadhaarNumber"
                            placeholder="XXXX XXXX XXXX"
                            maxLength={12}
                            {...form.register("aadhaarNumber")}
                            disabled={kycStatus.aadhaar}
                          />
                          <Button
                            type="button"
                            variant={kycStatus.aadhaar ? "secondary" : "default"}
                            onClick={() => verifyKYC("aadhaar")}
                            disabled={kycStatus.aadhaar || kycVerifying === "aadhaar" || !validateAadhaar(form.watch("aadhaarNumber"))}
                            className="w-28 press-scale"
                          >
                            {kycVerifying === "aadhaar" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : kycStatus.aadhaar ? (
                              "Verified"
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        </div>
                        {form.formState.errors.aadhaarNumber && (
                          <p className="text-xs text-destructive">{form.formState.errors.aadhaarNumber.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="panNumber">PAN Number *</Label>
                          {kycStatus.pan && (
                            <Badge className="bg-success/10 text-success border-success/20 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="panNumber"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className="uppercase"
                            {...form.register("panNumber")}
                            disabled={kycStatus.pan}
                          />
                          <Button
                            type="button"
                            variant={kycStatus.pan ? "secondary" : "default"}
                            onClick={() => verifyKYC("pan")}
                            disabled={kycStatus.pan || kycVerifying === "pan" || !validatePan(form.watch("panNumber"))}
                            className="w-28 press-scale"
                          >
                            {kycVerifying === "pan" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : kycStatus.pan ? (
                              "Verified"
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        </div>
                        {form.formState.errors.panNumber && (
                          <p className="text-xs text-destructive">{form.formState.errors.panNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
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
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button type="submit" disabled={isLoading} className="gap-2 press-scale">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            ) : (
              <Button type="button" onClick={nextStep} className="gap-2 press-scale">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
