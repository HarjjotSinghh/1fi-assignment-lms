"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { loginUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    RiWallet3Line,
    RiMailLine,
    RiLockLine,
    RiErrorWarningLine,
    RiArrowRightLine,
    RiShieldCheckLine,
    RiFlashlightLine,
    RiStackLine,
} from "react-icons/ri";

const features = [
    {
        icon: RiFlashlightLine,
        title: "Lightning Fast",
        description: "Process loans in minutes",
    },
    {
        icon: RiShieldCheckLine,
        title: "Secure",
        description: "Bank-grade security",
    },
    {
        icon: RiStackLine,
        title: "Scalable",
        description: "Built for growth",
    },
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
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-px h-full bg-primary-foreground"
                                style={{ left: `${i * 5}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-foreground flex items-center justify-center">
                            <RiWallet3Line className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-heading text-2xl font-bold">1Fi LMS</span>
                    </Link>
                </div>

                <motion.div
                    className="relative z-10 space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div>
                        <h1 className="font-heading text-4xl font-bold leading-tight">
                            Welcome back to the future of lending
                        </h1>
                        <p className="mt-4 text-lg text-primary-foreground/80">
                            Access your dashboard to manage loan applications, track collateral, and grow your business.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {features.map((feature) => (
                            <div key={feature.title} className="p-4 bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20">
                                <feature.icon className="w-8 h-8 mb-3" />
                                <p className="font-semibold">{feature.title}</p>
                                <p className="text-sm text-primary-foreground/70">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="relative z-10">
                    <p className="text-sm text-primary-foreground/70">
                        © {new Date().getFullYear()} 1Fi LMS. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-6 border-b">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary flex items-center justify-center">
                            <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-heading text-xl font-bold">1Fi LMS</span>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                    <motion.div
                        className="w-full max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="hidden lg:flex justify-end mb-8">
                            <ThemeToggle />
                        </div>

                        <div className="mb-8">
                            <h2 className="font-heading text-3xl font-bold">Sign in</h2>
                            <p className="mt-2 text-muted-foreground">
                                Enter your credentials to access your account
                            </p>
                        </div>

                        {registered && (
                            <motion.div
                                className="mb-6 p-4 bg-primary/10 border border-primary/20 flex items-center gap-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <RiShieldCheckLine className="w-5 h-5 text-primary flex-shrink-0" />
                                <p className="text-sm text-primary">
                                    Registration successful! Please sign in with your credentials.
                                </p>
                            </motion.div>
                        )}

                        {state?.error && (
                            <motion.div
                                className="mb-6 p-4 bg-destructive/10 border border-destructive/20 flex items-center gap-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <RiErrorWarningLine className="w-5 h-5 text-destructive flex-shrink-0" />
                                <p className="text-sm text-destructive">{state.error}</p>
                            </motion.div>
                        )}

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
                                        className="pl-10 h-11"
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
                                    <Link
                                        href="#"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11"
                                        required
                                    />
                                </div>
                                {state?.errors?.password && (
                                    <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium press-scale"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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

                        <div className="mt-8 text-center">
                            <p className="text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/register"
                                    className="text-primary font-medium hover:underline"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>

                        <div className="mt-8 pt-8 border-t">
                            <p className="text-xs text-center text-muted-foreground">
                                By signing in, you agree to our{" "}
                                <Link href="#" className="underline hover:text-foreground">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="#" className="underline hover:text-foreground">
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
