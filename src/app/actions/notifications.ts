"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction(userId: string) {
    try {
        const data = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(10);

        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { success: false, error: "Failed to fetch notifications" };
    }
}

export async function markNotificationReadAction(id: string) {
    try {
        await db
            .update(notifications)
            .set({
                isRead: true,
                readAt: new Date().toISOString()
            })
            .where(eq(notifications.id, id));

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark notification read:", error);
        return { success: false, error: "Failed to update notification" };
    }
}

export async function createNotificationAction(userId: string, title: string, message: string, type = "INFO") {
    try {
        await db.insert(notifications).values({
            userId,
            title,
            message,
            type,
            isRead: false,
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create notification" };
    }
}
