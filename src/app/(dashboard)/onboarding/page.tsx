import { Suspense } from "react";
import { Metadata } from "next";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Complete Your Profile | Fiquity Technology",
  description: "Complete your profile and verify your identity to get started with Fiquity Technology.",
};

export default function OnboardingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-none border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative space-y-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Set up your profile to unlock the full potential of Fiquity Technology. 
            KYC verification is optional now but required for loan applications.
          </p>
        </div>
      </div>

      {/* Onboarding Form */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
