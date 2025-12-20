"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { registerUser } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiLockLine,
  RiMailLine,
  RiUserLine,
  RiWallet3Line,
} from "react-icons/ri";

const benefits = [
  "Automated LAMF workflows and approvals",
  "Unified collateral and portfolio tracking",
  "Role-based controls and audit readiness",
  "Analytics exports for credit committees",
];

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerUser, undefined);

  useEffect(() => {
    if (state?.success) {
      router.push("/login?registered=true");
    }
  }, [state?.success, router]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-12 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-16 right-0 h-60 w-60 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-white/10 flex items-center justify-center">
              <RiWallet3Line className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold">Fiquity Technology</span>
          </Link>
        </div>

        <motion.div
          className="relative z-10 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <Badge className="w-fit rounded-full border border-white/30 bg-white/10 text-white">
            Launch new lending ops
          </Badge>
          <div>
            <h1 className="font-heading text-5xl font-bold leading-tight">
              Start your next-generation lending workflow.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Join teams modernizing LAMF operations with clear visibility and automation.
            </p>
          </div>
          <div className="grid gap-3 stagger-children">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-white/80">
                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center">
                  <RiCheckboxCircleLine className="h-4 w-4 text-white" />
                </div>
                {benefit}
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10 text-sm text-white/60">
          Copyright {new Date().getFullYear()} Fiquity Technology. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-primary flex items-center justify-center">
              <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">Fiquity Technology</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <motion.div
            className="w-full max-w-md space-y-8 stagger-children"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hidden lg:flex justify-end">
              <ThemeToggle />
            </div>

            <div>
              <h2 className="font-heading text-3xl font-bold">Create account</h2>
              <p className="mt-2 text-muted-foreground">
                Set up your workspace and start configuring products.
              </p>
            </div>

            {state?.error && (
              <div className="rounded-none border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
                <RiErrorWarningLine className="h-4 w-4" />
                {state.error}
              </div>
            )}

            <Card className="border bg-card/80">
              <CardContent className="p-6 space-y-5">
                <form action={formAction} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Harjot Rana"
                        className="pl-10 h-11 rounded-none"
                        required
                      />
                    </div>
                    {state?.errors?.name && (
                      <p className="text-sm text-destructive">{state.errors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10 h-11 rounded-none"
                        required
                      />
                    </div>
                    {state?.errors?.email && (
                      <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="********"
                        className="pl-10 h-11 rounded-none"
                        required
                      />
                    </div>
                    {state?.errors?.password && (
                      <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="********"
                        className="pl-10 h-11 rounded-none"
                        required
                      />
                    </div>
                    {state?.errors?.confirmPassword && (
                      <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium rounded-none press-scale"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create account
                        <RiArrowRightLine className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="#" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
