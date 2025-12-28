"use server";

import { db } from "@/db";
import { partners, apiKeys, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getPartners() {
    try {
        const allPartners = await db.query.partners.findMany({
            orderBy: [desc(partners.createdAt)],
            with: {
                apiKey: true
            }
        });
        return { success: true, data: allPartners };
    } catch (error) {
        console.error("Error fetching partners:", error);
        return { success: false, error: "Failed to fetch partners" };
    }
}

export async function createPartner(data: {
    name: string;
    code: string;
    type: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    webhookUrl?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const [newPartner] = await db.insert(partners).values({
            ...data,
            revenueSharePercent: 0,
            isActive: true,
        }).returning();

        revalidatePath("/configuration/partners");
        return { success: true, data: newPartner };
    } catch (error) {
        console.error("Error creating partner:", error);
        return { success: false, error: "Failed to create partner" };
    }
}

export async function updatePartner(id: string, data: Partial<typeof partners.$inferInsert>) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const [updatedPartner] = await db.update(partners)
            .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
            .where(eq(partners.id, id))
            .returning();

        revalidatePath("/configuration/partners");
        return { success: true, data: updatedPartner };
    } catch (error) {
        console.error("Error updating partner:", error);
        return { success: false, error: "Failed to update partner" };
    }
}

export async function generatePartnerApiKey(partnerId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Generate a secure random key
        const key = `sk_live_${crypto.randomUUID().replace(/-/g, '')}`;

        // Create API Key record
        const [apiKey] = await db.insert(apiKeys).values({
            key,
            name: `Key for partner ${partnerId}`,
            userId: session.user.id, // The admin user generating the key
            isActive: true,
        }).returning();

        // Link to partner
        await db.update(partners)
            .set({ apiKeyId: apiKey.id })
            .where(eq(partners.id, partnerId));

        revalidatePath("/configuration/partners");
        return { success: true, data: { ...apiKey, key } }; // Return key explicitly
    } catch (error) {
        console.error("Error generating API key:", error);
        return { success: false, error: "Failed to generate API key" };
    }
}
