import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { eq, and } from "drizzle-orm";
import { formatPushPayload, sendPushNotification, PushSubscription } from "@/lib/push-notifications";

// POST - Send push notification
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "system:manage")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, title, message, type, link, entityType, entityId, sendToAll } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message required" }, { status: 400 });
        }

        let targetSubscriptions: Array<{
            id: string;
            endpoint: string;
            p256dh: string;
            auth: string;
            userId: string;
        }> = [];

        if (sendToAll) {
            // Get all active subscriptions
            targetSubscriptions = await db.query.pushSubscriptions.findMany({
                where: eq(pushSubscriptions.isActive, true),
            });
        } else if (userId) {
            // Get subscriptions for specific user
            targetSubscriptions = await db.query.pushSubscriptions.findMany({
                where: and(
                    eq(pushSubscriptions.userId, userId),
                    eq(pushSubscriptions.isActive, true)
                ),
            });
        } else {
            return NextResponse.json({ error: "userId or sendToAll required" }, { status: 400 });
        }

        const payload = formatPushPayload({
            title,
            message,
            type: type || "INFO",
            link,
            entityType,
            entityId,
        });

        let sent = 0;
        let failed = 0;

        // Also create in-app notification
        if (userId) {
            await db.insert(notifications).values({
                userId,
                title,
                message,
                type: type || "INFO",
                link,
                entityType,
                entityId,
            });
        }

        // Send push notifications
        for (const sub of targetSubscriptions) {
            const subscription: PushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
            };

            const result = await sendPushNotification(subscription, payload);
            if (result.success) {
                sent++;
                // Update last used time
                await db.update(pushSubscriptions)
                    .set({ lastUsedAt: new Date().toISOString() })
                    .where(eq(pushSubscriptions.id, sub.id));
            } else {
                failed++;
            }
        }

        return NextResponse.json({
            success: true,
            sent,
            failed,
            totalTargets: targetSubscriptions.length,
        });
    } catch (error) {
        console.error("Push notification error:", error);
        return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 });
    }
}
