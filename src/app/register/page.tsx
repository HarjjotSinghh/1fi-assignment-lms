"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    RiWallet3Line,
    RiMailLine,
    RiLockLine,
    RiUserLine,
    RiErrorWarningLine,
    RiArrowRightLine,
    RiCheckboxCircleLine,
} from "react-icons/ri";

const benefits = [
    "Manage loan applications seamlessly",
    "Real-time collateral monitoring",
    "Advanced analytics dashboard",
    "Multi-user role management",
    "API access for integrations",
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
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-full h-full">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-px w-full bg-background"
                                style={{ top: `${i * 5}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary flex items-center justify-center">
                            <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
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
                            Start your lending journey today
                        </h1>
                        <p className="mt-4 text-lg text-background/70">
                            Join hundreds of NBFCs transforming their LAMF operations with 1Fi LMS.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit}
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                            >
                                <div className="w-6 h-6 bg-primary flex items-center justify-center flex-shrink-0">
                                    <RiCheckboxCircleLine className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <span className="text-background/90">{benefit}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <div className="relative z-10">
                    <p className="text-sm text-background/50">
                        © {new Date().getFullYear()} 1Fi LMS. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Panel - Register Form */}
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
                            <h2 className="font-heading text-3xl font-bold">Create account</h2>
                            <p className="mt-2 text-muted-foreground">
                                Get started with your free account today
                            </p>
                        </div>

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
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="pl-10 h-11"
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
                                        className="pl-10 h-11"
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
                                        placeholder="••••••••"
                                        className="pl-10 h-11"
                                        required
                                    />
                                </div>
                                {state?.errors?.password && (
                                    <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 6 characters
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11"
                                        required
                                    />
                                </div>
                                {state?.errors?.confirmPassword && (
                                    <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
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

                        <div className="mt-8 text-center">
                            <p className="text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="text-primary font-medium hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        <div className="mt-8 pt-8 border-t">
                            <p className="text-xs text-center text-muted-foreground">
                                By creating an account, you agree to our{" "}
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
