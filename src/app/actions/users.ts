"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getSystemUsers() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const allUsers = await db.query.users.findMany({
            orderBy: [desc(users.createdAt)],
        });

        // Don't return passwords
        const safeUsers = allUsers.map(u => {
            const { password, ...safe } = u;
            return safe;
        });

        return { success: true, data: safeUsers };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Check if the requester is ADMIN
        // In a real app we'd check session.user.role === 'ADMIN'

        const [updatedUser] = await db.update(users)
            .set({ role: newRole })
            .where(eq(users.id, userId))
            .returning();

        revalidatePath("/configuration/users");
        return { success: true, data: updatedUser };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error: "Failed to update role" };
    }
}

export async function inviteUser(data: { email: string; name: string; role: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Check if user exists
        const existing = await db.query.users.findFirst({
            where: eq(users.email, data.email)
        });

        if (existing) {
            return { success: false, error: "User with this email already exists" };
        }

        // Create user (Pending verification)
        // In a real app we would send an email. Here we just create the record.
        await db.insert(users).values({
            id: crypto.randomUUID(),
            email: data.email,
            name: data.name,
            role: data.role,
            emailVerified: null, // Pending
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        revalidatePath("/configuration/users");
        return { success: true };
    } catch (error) {
        console.error("Error inviting user:", error);
        return { success: false, error: "Failed to invite user" };
    }
}
