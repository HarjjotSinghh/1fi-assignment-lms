"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn, validateAadhaar, validatePan, validatePhone, formatCurrency } from "@/lib/utils";
import type { LoanProduct } from "@/db/schema";

const steps = [
  { id: "personal", title: "Personal", icon: RiUserLine },
  { id: "kyc", title: "KYC", icon: RiShieldCheckLine },
  { id: "address", title: "Address", icon: RiMapPinLine },
  { id: "employment", title: "Employment", icon: RiBriefcaseLine },
  { id: "bank", title: "Bank", icon: RiBankCardLine },
  { id: "loan", title: "Loan", icon: RiFileListLine },
];

interface LoanFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // KYC
  aadhaarNumber: string;
  panNumber: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  
  // Employment
  employmentType: "SALARIED" | "SELF_EMPLOYED" | "BUSINESS";
  monthlyIncome: string;
  companyName: string;
  
  // Bank Details
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  
  // Loan Details
  productId: string;
  requestedAmount: string;
  tenure: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.4 } },
};

const focusStyles = "focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/20 border-primary/10 transition-all duration-200 ease-in-out";

export function LoanApplicationForm({ products }: { products: LoanProduct[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycVerifying, setKycVerifying] = useState<"aadhaar" | "pan" | null>(null);
  const [kycStatus, setKycStatus] = useState({ aadhaar: false, pan: false });
  const router = useRouter();

  const [formData, setFormData] = useState<LoanFormData>({
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
    monthlyIncome: "50000",
    companyName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankName: "",
    productId: products[0]?.id || "",
    requestedAmount: "100000",
    tenure: "12",
  });

  const updateFormData = (field: keyof LoanFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);

  const verifyKYC = async (type: "aadhaar" | "pan") => {
    setKycVerifying(type);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setKycStatus((prev) => ({ ...prev, [type]: true }));
    setKycVerifying(null);
    toast.success(`${type === "aadhaar" ? "Aadhaar" : "PAN"} verified successfully!`);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!kycStatus.aadhaar || !kycStatus.pan) {
      toast.error("KYC verification required", {
        description: "Please verify both Aadhaar and PAN before submitting.",
      });
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...formData,
           monthlyIncome: parseFloat(formData.monthlyIncome),
           requestedAmount: parseFloat(formData.requestedAmount),
           tenure: parseInt(formData.tenure),
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
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.firstName && formData.lastName && formData.email && validatePhone(formData.phone);
      case 1:
        return kycStatus.aadhaar && kycStatus.pan;
      case 2:
        return formData.addressLine1 && formData.city && formData.state && formData.pincode.length === 6;
      case 3:
        return formData.employmentType && formData.monthlyIncome;
      case 4:
        return formData.bankAccountNumber && formData.bankIfscCode && formData.bankName;
      case 5:
        return formData.productId && formData.requestedAmount && formData.tenure;
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      {/* Progress indicator with Icons */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex justify-between relative px-2">
          {/* Progress Bar Background */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
          
          {/* Active Progress Bar */}
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-primary -translate-y-1/2 z-0"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.6 }}
          />

          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <motion.div
                key={index}
                className="flex flex-col items-center relative z-10"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-background border-2 border-muted text-muted-foreground",
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <RiCheckLine className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </motion.div>
                <motion.span
                  className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Card className="border shadow-xl rounded-none overflow-hidden glassmorphism">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
              >
                {/* Step 1: Personal Info */}
                {currentStep === 0 && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RiUserLine className="text-primary" /> Personal Information
                      </CardTitle>
                      <CardDescription>
                        Basic details to get started with your application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="Harjot"
                            value={formData.firstName}
                            onChange={(e) => updateFormData("firstName", e.target.value)}
                            className={cn("transition-all duration-300", focusStyles)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Rana"
                            value={formData.lastName}
                            onChange={(e) => updateFormData("lastName", e.target.value)}
                            className={cn("transition-all duration-300", focusStyles)}
                          />
                        </motion.div>
                      </div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="me@harjot.co"
                          value={formData.email}
                          onChange={(e) => updateFormData("email", e.target.value)}
                          className={cn("transition-all duration-300", focusStyles)}
                        />
                      </motion.div>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={(e) => updateFormData("phone", e.target.value)}
                            className={cn("transition-all duration-300", focusStyles)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                            className={cn("transition-all duration-300", focusStyles)}
                          />
                        </motion.div>
                      </div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: KYC Verification */}
                {currentStep === 1 && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RiShieldCheckLine className="text-primary" /> KYC Verification
                      </CardTitle>
                      <CardDescription>
                        Securely verify your identity
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-none flex items-start gap-3">
                        <RiAlertLine className="h-5 w-5 text-primary mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          Please enter your Aadhaar and PAN details. We'll perform a real-time verification.
                        </p>
                      </div>

                      <motion.div variants={fadeInUp} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="aadhaar">Aadhaar Number</Label>
                          {kycStatus.aadhaar && (
                            <Badge className="bg-primary/10 text-primary border-none">
                              <RiCheckLine className="mr-1" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="aadhaar"
                            placeholder="XXXX XXXX XXXX"
                            maxLength={12}
                            value={formData.aadhaarNumber}
                            onChange={(e) => updateFormData("aadhaarNumber", e.target.value)}
                            disabled={kycStatus.aadhaar}
                            className={cn("flex-1", focusStyles)}
                          />
                          <Button 
                            type="button"
                            onClick={() => verifyKYC("aadhaar")}
                            disabled={kycStatus.aadhaar || kycVerifying === "aadhaar" || !validateAadhaar(formData.aadhaarNumber)}
                            className="rounded-none min-w-[100px]"
                          >
                            {kycVerifying === "aadhaar" ? <RiLoader4Line className="animate-spin" /> : kycStatus.aadhaar ? "Done" : "Verify"}
                          </Button>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pan">PAN Number</Label>
                          {kycStatus.pan && (
                            <Badge className="bg-primary/10 text-primary border-none">
                              <RiCheckLine className="mr-1" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="pan"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className={cn("flex-1 uppercase", focusStyles)}
                            value={formData.panNumber}
                            onChange={(e) => updateFormData("panNumber", e.target.value)}
                            disabled={kycStatus.pan}
                          />
                          <Button 
                            type="button"
                            onClick={() => verifyKYC("pan")}
                            disabled={kycStatus.pan || kycVerifying === "pan" || !validatePan(formData.panNumber)}
                            className="rounded-none min-w-[100px]"
                          >
                            {kycVerifying === "pan" ? <RiLoader4Line className="animate-spin" /> : kycStatus.pan ? "Done" : "Verify"}
                          </Button>
                        </div>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Address */}
                {currentStep === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RiMapPinLine className="text-primary" /> Permanent Address
                      </CardTitle>
                      <CardDescription>
                        Where do you currently reside?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          placeholder="House No, Street"
                          value={formData.addressLine1}
                          onChange={(e) => updateFormData("addressLine1", e.target.value)}
                          className={cn(focusStyles)}
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input
                          id="addressLine2"
                          placeholder="Landmark, Area"
                          value={formData.addressLine2}
                          onChange={(e) => updateFormData("addressLine2", e.target.value)}
                          className={cn(focusStyles)}
                        />
                      </motion.div>
                      <div className="grid grid-cols-3 gap-4">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Mumbai"
                            value={formData.city}
                            onChange={(e) => updateFormData("city", e.target.value)}
                            className={cn(focusStyles)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            placeholder="Maharashtra"
                            value={formData.state}
                            onChange={(e) => updateFormData("state", e.target.value)}
                            className={cn(focusStyles)}
                          />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            placeholder="400001"
                            maxLength={6}
                            value={formData.pincode}
                            onChange={(e) => updateFormData("pincode", e.target.value)}
                            className={cn(focusStyles)}
                          />
                        </motion.div>
                      </div>
                    </CardContent>
                  </>
                )}

                {/* Step 4: Employment */}
                {currentStep === 3 && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RiBriefcaseLine className="text-primary" /> Employment Details
                      </CardTitle>
                      <CardDescription>
                        Information about your source of income
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Employment Type</Label>
                        <RadioGroup 
                          value={formData.employmentType}
                          onValueChange={(v: any) => updateFormData("employmentType", v)}
                          className="grid grid-cols-3 gap-4"
                        >
                          {[
                            { value: "SALARIED", label: "Salaried" },
                            { value: "SELF_EMPLOYED", label: "Self Employed" },
                            { value: "BUSINESS", label: "Business" },
                          ].map((type) => (
                            <div key={type.value}>
                              <RadioGroupItem
                                value={type.value}
                                id={type.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={type.value}
                                className="flex flex-col items-center justify-between rounded-none border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                              >
                                <span className="text-sm font-medium">{type.label}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="companyName">Company / Business Name</Label>
                        <Input
                          id="companyName"
                          placeholder="Google Inc."
                          value={formData.companyName}
                          onChange={(e) => updateFormData("companyName", e.target.value)}
                          className={cn(focusStyles)}
                        />
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="monthlyIncome">Monthly Income (₹)</Label>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={formData.monthlyIncome}
                          onChange={(e) => updateFormData("monthlyIncome", e.target.value)}
                          className={cn(focusStyles)}
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 5: Bank Details */}
                {currentStep === 4 && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RiBankCardLine className="text-primary" /> Bank Account
                      </CardTitle>
                      <CardDescription>
                        Where should we disburse the funds?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="HDFC Bank"
                          value={formData.bankName}
                          onChange={(e) => updateFormData("bankName", e.target.value)}
                          className={cn(focusStyles)}
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          placeholder="HDFC0001234"
                          className={cn("uppercase", focusStyles)}
                          value={formData.bankIfscCode}
                          onChange={(e) => updateFormData("bankIfscCode", e.target.value)}
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="accountNo">Account Number</Label>
                        <Input
                          id="accountNo"
                          placeholder="XXXXXXXXXXXX"
                          value={formData.bankAccountNumber}
                          onChange={(e) => updateFormData("bankAccountNumber", e.target.value)}
                          className={cn(focusStyles)}
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 6: Loan Details */}
                {currentStep === 5 && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RiFileListLine className="text-primary" /> Loan Preferences
                      </CardTitle>
                      <CardDescription>
                        Configure your loan terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Select Loan Product</Label>
                        <Select
                          value={formData.productId}
                          onValueChange={(v) => updateFormData("productId", v)}
                        >
                          <SelectTrigger className={cn("rounded-none h-12", focusStyles)}>
                            <SelectValue placeholder="Choose a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {p.interestRatePercent}% p.a.
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <div className="grid grid-cols-2 gap-4">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="amount">Requested Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={formData.requestedAmount}
                            onChange={(e) => updateFormData("requestedAmount", e.target.value)}
                            className={cn(focusStyles)}
                          />
                          {selectedProduct && (
                             <p className="text-[10px] text-muted-foreground">
                               Limit: {formatCurrency(selectedProduct.minAmount)} - {formatCurrency(selectedProduct.maxAmount)}
                             </p>
                          )}
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="tenure">Tenure (Months)</Label>
                          <Input
                            id="tenure"
                            type="number"
                            value={formData.tenure}
                            onChange={(e) => updateFormData("tenure", e.target.value)}
                            className={cn(focusStyles)}
                          />
                           {selectedProduct && (
                             <p className="text-[10px] text-muted-foreground">
                               Limit: {selectedProduct.minTenureMonths} - {selectedProduct.maxTenureMonths} Mo.
                             </p>
                          )}
                        </motion.div>
                      </div>

                      {selectedProduct && (
                        <div className="p-4 bg-muted/50 rounded-none border border-dashed border-muted-foreground/20 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">LTV Ratio</span>
                            <span className="font-medium">{selectedProduct.maxLtvPercent}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Estimated EMI</span>
                            <span className="font-semibold text-primary">₹ {Math.round(parseInt(formData.requestedAmount) / parseInt(formData.tenure) * 1.1).toLocaleString()}*</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <CardFooter className="flex justify-between pt-6 pb-8 px-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-1 rounded-none h-11 px-6 border-muted-foreground/20"
              >
                <RiArrowLeftLine className="h-4 w-4" /> Back
              </Button>
              
              <Button
                type="button"
                onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
                disabled={!isStepValid() || isSubmitting}
                className="flex items-center gap-1 rounded-none h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                {isSubmitting ? (
                  <>
                    <RiLoader4Line className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    {currentStep === steps.length - 1 ? "Submit Application" : "Continue"}
                    {currentStep === steps.length - 1 ? (
                      <RiCheckLine className="h-4 w-4" />
                    ) : (
                      <RiArrowRightLine className="h-4 w-4" />
                    )}
                  </>
                )}
              </Button>
            </CardFooter>
          </div>
        </Card>
      </motion.div>

      {/* Step indicator text */}
      <motion.div
        className="mt-6 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
      </motion.div>
    </div>
  );
}
