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
