import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { getPublicVAPIDKey } from "@/lib/push-notifications";

// GET - Get VAPID public key and user's subscriptions
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's active subscriptions
        const subscriptions = await db.query.pushSubscriptions.findMany({
            where: and(
                eq(pushSubscriptions.userId, session.user.id),
                eq(pushSubscriptions.isActive, true)
            ),
        });

        return NextResponse.json({
            vapidPublicKey: getPublicVAPIDKey(),
            subscriptions: subscriptions.map(s => ({
                id: s.id,
                deviceName: s.deviceName,
                createdAt: s.createdAt,
                lastUsedAt: s.lastUsedAt,
            })),
        });
    } catch (error) {
        console.error("Push subscribe GET error:", error);
        return NextResponse.json({ error: "Failed to get subscriptions" }, { status: 500 });
    }
}

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { subscription, deviceName } = body;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
        }

        // Check if this endpoint already exists
        const existing = await db.query.pushSubscriptions.findFirst({
            where: eq(pushSubscriptions.endpoint, subscription.endpoint),
        });

        if (existing) {
            // Update existing subscription
            await db.update(pushSubscriptions)
                .set({
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    isActive: true,
                    lastUsedAt: new Date().toISOString(),
                    deviceName: deviceName || existing.deviceName,
                })
                .where(eq(pushSubscriptions.id, existing.id));

            return NextResponse.json({ 
                success: true, 
                message: "Subscription updated",
                subscriptionId: existing.id,
            });
        }

        // Create new subscription
        const userAgent = request.headers.get("user-agent") || "";
        const [newSubscription] = await db.insert(pushSubscriptions)
            .values({
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent,
                deviceName: deviceName || detectDeviceName(userAgent),
            })
            .returning();

        return NextResponse.json({
            success: true,
            message: "Subscribed to push notifications",
            subscriptionId: newSubscription.id,
        });
    } catch (error) {
        console.error("Push subscribe POST error:", error);
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const subscriptionId = searchParams.get("id");

        if (subscriptionId) {
            // Delete specific subscription
            await db.update(pushSubscriptions)
                .set({ isActive: false })
                .where(and(
                    eq(pushSubscriptions.id, subscriptionId),
                    eq(pushSubscriptions.userId, session.user.id)
                ));
        } else {
            // Delete all subscriptions for user
            await db.update(pushSubscriptions)
                .set({ isActive: false })
                .where(eq(pushSubscriptions.userId, session.user.id));
        }

        return NextResponse.json({ success: true, message: "Unsubscribed" });
    } catch (error) {
        console.error("Push unsubscribe error:", error);
        return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }
}

// Helper to detect device name from user agent
function detectDeviceName(userAgent: string): string {
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Macintosh")) return "Mac";
    if (userAgent.includes("Linux")) return "Linux";
    return "Unknown Device";
}
