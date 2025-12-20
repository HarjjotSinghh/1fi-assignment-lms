"use server";

import { signIn, signOut, hashPassword } from "@/lib/auth";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { AuthError } from "next-auth";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type AuthState = {
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
};

export async function registerUser(
    prevState: AuthState | undefined,
    formData: FormData
): Promise<AuthState> {
    const rawFormData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = registerSchema.safeParse(rawFormData);

    if (!validated.success) {
        return {
            success: false,
            errors: validated.error.flatten().fieldErrors,
        };
    }

    const { name, email, password } = validated.data;

    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return {
                success: false,
                error: "An account with this email already exists",
            };
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);

        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: "USER",
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            error: "Something went wrong. Please try again.",
        };
    }
}

export async function loginUser(
    prevState: AuthState | undefined,
    formData: FormData
): Promise<AuthState> {
    const rawFormData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const validated = loginSchema.safeParse(rawFormData);

    if (!validated.success) {
        return {
            success: false,
            errors: validated.error.flatten().fieldErrors,
        };
    }

    try {
        await signIn("credentials", {
            email: rawFormData.email,
            password: rawFormData.password,
            redirectTo: "/dashboard",
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return {
                        success: false,
                        error: "Invalid email or password",
                    };
                default:
                    return {
                        success: false,
                        error: "Something went wrong. Please try again.",
                    };
            }
        }
        // If the error is a redirect (NEXT_REDIRECT), rethrow it
        throw error;
    }
}

export async function logoutUser() {
    await signOut({ redirectTo: "/" });
}
