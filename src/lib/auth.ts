import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    jwt: {
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const validated = loginSchema.safeParse(credentials);

                if (!validated.success) {
                    return null;
                }

                const { email, password } = validated.data;

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role || "USER";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
});

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

// Helper function to compare passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}
