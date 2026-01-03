
"use server";

import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createWatchlistEntry(data: {
    entityType: string;
    entityValue: string;
    listType: string;
    reason: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.insert(watchlist).values({
            ...data,
            id: crypto.randomUUID(),
            addedById: session.user.id,
            addedAt: new Date().toISOString(),
        });

        revalidatePath("/watchlist");
        return { success: true };
    } catch (error) {
        console.error("Error creating watchlist entry:", error);
        return { success: false, error: "Failed to create watchlist entry" };
    }
}
