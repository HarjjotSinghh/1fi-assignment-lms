"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { loginUser } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  RiArrowRightLine,
  RiErrorWarningLine,
  RiFlashlightLine,
  RiLockLine,
  RiMailLine,
  RiShieldCheckLine,
  RiStackLine,
  RiWallet3Line,
} from "react-icons/ri";

const highlights = [
  { icon: RiFlashlightLine, label: "Instant approvals", detail: "2.1 day average" },
  { icon: RiShieldCheckLine, label: "Secure workflows", detail: "Audit-ready trails" },
  { icon: RiStackLine, label: "Modular products", detail: "Dynamic LTV rules" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "true";
  const [state, formAction, isPending] = useActionState(loginUser, undefined);

  useEffect(() => {
    if (state?.success) {
      router.push(callbackUrl);
    }
  }, [state?.success, router, callbackUrl]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-12 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 right-0 h-60 w-60 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <RiWallet3Line className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold">1Fi LMS</span>
          </Link>
        </div>

        <motion.div
          className="relative z-10 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Badge className="w-fit rounded-full border border-white/30 bg-white/10 text-white">
            Secure access
          </Badge>
          <div>
            <h1 className="font-heading text-5xl font-bold leading-tight">
              Welcome back to your lending command center.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Monitor pipeline health, collateral coverage, and approvals from a single view.
            </p>
          </div>
          <div className="grid gap-4">
            {highlights.map((item) => (
              <Card key={item.label} className="border-white/10 bg-white/5">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-white/60">{item.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10 text-sm text-white/60">
          Copyright {new Date().getFullYear()} 1Fi LMS. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">1Fi LMS</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <motion.div
            className="w-full max-w-md space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hidden lg:flex justify-end">
              <ThemeToggle />
            </div>

            <div>
              <h2 className="font-heading text-3xl font-bold">Sign in</h2>
              <p className="mt-2 text-muted-foreground">
                Enter your credentials to access your account.
              </p>
            </div>

            {registered && (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
                Registration successful. Please sign in with your credentials.
              </div>
            )}

            {state?.error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
                <RiErrorWarningLine className="h-4 w-4" />
                {state.error}
              </div>
            )}

            <Card className="border bg-card/80">
              <CardContent className="p-6 space-y-5">
                <form action={formAction} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                    {state?.errors?.email && (
                      <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="#" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="********"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                    {state?.errors?.password && (
                      <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium rounded-xl press-scale"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign in
                        <RiArrowRightLine className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Create account
              </Link>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
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
