"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  RiUserLine,
  RiShieldCheckLine,
  RiMapPinLine,
  RiBriefcaseLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiLoader4Line,
  RiCheckLine,
  RiSkipForwardLine,
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
import { KycVerificationCard } from "@/components/kyc/kyc-verification-card";
import { toast } from "sonner";
import { validatePhone } from "@/lib/utils";

// Schema for onboarding - KYC is optional
const onboardingSchema = z.object({
  // Personal Info (required)
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(validatePhone, "Invalid phone number (10 digits starting with 6-9)"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),

  // Address (optional for onboarding)
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),

  // Employment (optional for onboarding)
  employmentType: z.enum(["SALARIED", "SELF_EMPLOYED", "BUSINESS"]).optional(),
  monthlyIncome: z.coerce.number().optional(),
  companyName: z.string().optional(),

  // KYC Info
  aadhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  { id: "personal", title: "Personal Info", icon: RiUserLine },
  { id: "kyc", title: "KYC Verification", icon: RiShieldCheckLine },
  { id: "address", title: "Address", icon: RiMapPinLine },
  { id: "employment", title: "Employment", icon: RiBriefcaseLine },
];

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [kycSkipped, setKycSkipped] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  // Check if returning from DigiLocker
  const kycVerification = searchParams.get("kyc_verification");
  const kycStatus = searchParams.get("kyc_status");

  // If returning with successful KYC
  if (kycStatus === "AUTHENTICATED" && !kycCompleted) {
    setKycCompleted(true);
  }

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as any,
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
      employmentType: undefined,
      monthlyIncome: undefined,
      companyName: "",
      aadhaarNumber: "",
      panNumber: "",
    },
  });

  // Fetch verified data if available
  useEffect(() => {
    if (kycVerification && kycStatus === "AUTHENTICATED") {
      fetch(`/api/kyc/digilocker/status?verification_id=${kycVerification}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.userDetails) {
            const { name, dob, mobile, aadhaarNumber, panNumber } = data.userDetails;
            
            // Parse name
            if (name) {
              const parts = name.trim().split(" ");
              if (parts.length > 0) form.setValue("firstName", parts[0]);
              if (parts.length > 1) form.setValue("lastName", parts.slice(1).join(" "));
            }

            // Parse DOB (DD-MM-YYYY to YYYY-MM-DD or similar)
            if (dob) {
              // DigiLocker often returns DD-MM-YYYY
              const [d, m, y] = dob.split("-");
              if (d && m && y) form.setValue("dateOfBirth", `${y}-${m}-${d}`);
            }

            if (mobile) form.setValue("phone", mobile);
            if (aadhaarNumber) form.setValue("aadhaarNumber", aadhaarNumber);
            if (panNumber) form.setValue("panNumber", panNumber);
            
            toast.success("Details pre-filled from DigiLocker");
          }
        })
        .catch((err) => console.error("Failed to fetch KYC details", err));
    }
  }, [kycVerification, kycStatus, form]);

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    if (fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate as (keyof OnboardingFormData)[]);
      if (!result) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0: return ["firstName", "lastName", "email", "phone", "dateOfBirth"];
      case 1: return []; // KYC step - no form fields to validate
      case 2: return []; // Address is optional
      case 3: return []; // Employment is optional
      default: return [];
    }
  };

  const handleKycComplete = (status: string) => {
    if (status === "AUTHENTICATED") {
      setKycCompleted(true);
      toast.success("KYC verification completed!");
    }
  };

  const handleKycSkip = () => {
    setKycSkipped(true);
    nextStep();
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      // Create customer profile
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          kycStatus: kycCompleted ? "VERIFIED" : "PENDING",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create profile");
      }

      toast.success("Profile created successfully!", {
        description: kycCompleted 
          ? "You're all set! Your KYC is verified."
          : "You can complete KYC later when applying for a loan.",
      });

      // Update session to reflect onboarding completion
      await update({ onboardingCompleted: true });

      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to create profile", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep || (index === 1 && kycCompleted);
          const isCurrent = index === currentStep;
          const isKycStep = index === 1;

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
                ) : isKycStep && kycSkipped ? (
                  <RiSkipForwardLine className="h-4 w-4" />
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
                      <Input id="firstName" placeholder="Harjot" {...form.register("firstName")} />
                      {form.formState.errors.firstName && (
                        <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Rana" {...form.register("lastName")} />
                      {form.formState.errors.lastName && (
                        <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" placeholder="me@harjot.co" {...form.register("email")} />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" placeholder="9876543210" {...form.register("phone")} />
                      {form.formState.errors.phone && (
                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
                      {form.formState.errors.dateOfBirth && (
                        <p className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</p>
                      )}
                    </div>
                    
                    {/* Verified Docs */}
                    <div className="space-y-2">
                       <Label htmlFor="aadhaarNumber">Aadhaar Number {form.watch("aadhaarNumber") && <span className="text-xs text-success ml-2">(Verified)</span>}</Label>
                       <Input 
                         id="aadhaarNumber" 
                         {...form.register("aadhaarNumber")} 
                         disabled={!!form.watch("aadhaarNumber")} 
                         className={form.watch("aadhaarNumber") ? "bg-muted" : ""}
                         placeholder="Verified from DigiLocker"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="panNumber">PAN Number {form.watch("panNumber") && <span className="text-xs text-success ml-2">(Verified)</span>}</Label>
                       <Input 
                         id="panNumber" 
                         {...form.register("panNumber")} 
                         disabled={!!form.watch("panNumber")}
                         className={form.watch("panNumber") ? "bg-muted" : ""}
                         placeholder="Verified from DigiLocker"
                       />
                    </div>
                  </div>
                )}

                {/* Step 1: KYC Verification */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <KycVerificationCard
                      mode="optional"
                      aadhaarVerified={kycCompleted}
                      panVerified={kycCompleted}
                      kycStatus={kycCompleted ? "VERIFIED" : "PENDING"}
                      onVerificationComplete={handleKycComplete}
                      onSkip={handleKycSkip}
                    />
                    
                    {kycSkipped && !kycCompleted && (
                      <p className="text-sm text-center text-muted-foreground">
                        You can complete KYC later when applying for a loan.
                      </p>
                    )}
                  </div>
                )}

                {/* Step 2: Address */}
                {currentStep === 2 && (
                  <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground">
                      Address information is optional. You can add it later.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input id="addressLine1" placeholder="House/Flat No, Street" {...form.register("addressLine1")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input id="addressLine2" placeholder="Landmark, Area" {...form.register("addressLine2")} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="Mumbai" {...form.register("city")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="Maharashtra" {...form.register("state")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input id="pincode" placeholder="400001" {...form.register("pincode")} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Employment */}
                {currentStep === 3 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                      Employment information is optional. You can add it later.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select
                        value={form.watch("employmentType")}
                        onValueChange={(value) => form.setValue("employmentType", value as "SALARIED" | "SELF_EMPLOYED" | "BUSINESS")}
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
                      <Label htmlFor="monthlyIncome">Monthly Income (₹)</Label>
                      <Input id="monthlyIncome" type="number" placeholder="50000" {...form.register("monthlyIncome")} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="companyName">Company / Business Name</Label>
                      <Input id="companyName" placeholder="ABC Pvt Ltd" {...form.register("companyName")} />
                    </div>
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
                Complete Profile
              </Button>
            ) : currentStep === 1 && !kycCompleted && !kycSkipped ? (
              <Button type="button" onClick={handleKycSkip} variant="secondary" className="gap-2">
                Skip KYC
                <RiSkipForwardLine className="h-4 w-4" />
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
