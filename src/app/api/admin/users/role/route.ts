import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SUPER_ADMIN_EMAIL = "harjjotsinghh@gmail.com";

const VALID_ROLES = ["USER", "MANAGER", "ADMIN"] as const;

const updateRoleSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    role: z.enum(VALID_ROLES, "Invalid role"),
});

// PATCH - Update user role (Super Admin only)
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        // Check if user is logged in and is the super admin
        if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "Unauthorized. Super admin access required." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validated = updateRoleSchema.safeParse(body);

        if (!validated.success) {
            const issues = validated.error.issues;
            return NextResponse.json(
                { error: issues[0]?.message || "Validation failed" },
                { status: 400 }
            );
        }

        const { userId, role } = validated.data;

        // Prevent changing super admin's own role
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (targetUser.email === SUPER_ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "Cannot modify super admin role" },
                { status: 403 }
            );
        }

        // Update the user's role
        const [updatedUser] = await db
            .update(users)
            .set({ role })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                email: users.email,
                role: users.role,
            });

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { error: "Failed to update user role" },
            { status: 500 }
        );
    }
}

// GET - List all users (Super Admin only)
export async function GET() {
    try {
        const session = await auth();

        // Check if user is logged in and is the super admin
        if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "Unauthorized. Super admin access required." },
                { status: 403 }
            );
        }

        const allUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            image: users.image,
            createdAt: users.createdAt,
        }).from(users);

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
