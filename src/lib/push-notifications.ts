/**
 * Push Notification Library
 * Web Push API integration for real-time notifications
 */

// Types for push subscriptions
export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: {
        url?: string;
        entityType?: string;
        entityId?: string;
    };
    actions?: Array<{
        action: string;
        title: string;
    }>;
}

// VAPID keys would normally come from environment variables
// For demo, these are placeholders - in production, generate real keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAf7-1OhlAP4tYxuIQBz6C6xYlk_EGE';

/**
 * Generate VAPID keys for Web Push
 * Run this once and store the keys in environment variables
 */
export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
    // In real implementation, use web-push library
    // const webpush = require('web-push');
    // return webpush.generateVAPIDKeys();
    
    return {
        publicKey: VAPID_PUBLIC_KEY,
        privateKey: VAPID_PRIVATE_KEY,
    };
}

/**
 * Get the public VAPID key for client subscription
 */
export function getPublicVAPIDKey(): string {
    return VAPID_PUBLIC_KEY;
}

/**
 * Format notification for Web Push
 */
export function formatPushPayload(notification: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    entityType?: string;
    entityId?: string;
}): NotificationPayload {
    // Choose icon based on notification type
    const icons: Record<string, string> = {
        ALERT: '/icons/alert.png',
        SUCCESS: '/icons/success.png',
        WARNING: '/icons/warning.png',
        ERROR: '/icons/error.png',
        INFO: '/icons/info.png',
    };

    return {
        title: notification.title,
        body: notification.message,
        icon: icons[notification.type || 'INFO'] || '/icons/icon-192x192.png',
        badge: '/icons/badge.png',
        tag: notification.entityType ? `${notification.entityType}-${notification.entityId}` : undefined,
        data: {
            url: notification.link || '/notifications',
            entityType: notification.entityType,
            entityId: notification.entityId,
        },
        actions: notification.link ? [
            { action: 'open', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
        ] : undefined,
    };
}

/**
 * Send push notification to a subscription
 * In production, use web-push library
 */
export async function sendPushNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        // For production, install web-push and use:
        // const webpush = require('web-push');
        // webpush.setVapidDetails(
        //     'mailto:admin@fiquity.com',
        //     VAPID_PUBLIC_KEY,
        //     VAPID_PRIVATE_KEY
        // );
        // await webpush.sendNotification(subscription, JSON.stringify(payload));

        console.log('Push notification sent:', {
            endpoint: subscription.endpoint.slice(0, 50) + '...',
            title: payload.title,
        });

        // Simulate sending - in production, this would actually send
        return { success: true };
    } catch (error) {
        console.error('Push notification error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Send push notification to all subscriptions for a user
 */
export async function sendPushToUser(
    userId: string,
    notification: {
        title: string;
        message: string;
        type?: string;
        link?: string;
        entityType?: string;
        entityId?: string;
    },
    db: any // Drizzle database instance
): Promise<{ sent: number; failed: number }> {
    try {
        // Get all active subscriptions for the user
        const subscriptions = await db.query.pushSubscriptions.findMany({
            where: (ps: any, { eq, and }: any) => and(
                eq(ps.userId, userId),
                eq(ps.isActive, true)
            ),
        });

        const payload = formatPushPayload(notification);
        let sent = 0;
        let failed = 0;

        for (const sub of subscriptions) {
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
            } else {
                failed++;
                // Note: In production, mark expired subscriptions as inactive
                // This would require passing the correct drizzle imports
                console.log('Push failed for subscription:', sub.id, result.error);
            }
        }

        return { sent, failed };
    } catch (error) {
        console.error('Send push to user error:', error);
        return { sent: 0, failed: 0 };
    }
}

/**
 * Notification types that should trigger push
 */
export const PUSH_NOTIFICATION_TYPES = [
    'MARGIN_CALL',
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'LOAN_APPROVED',
    'LOAN_REJECTED',
    'DOCUMENT_REQUIRED',
    'KYC_VERIFIED',
    'COLLATERAL_ALERT',
    'SYSTEM_ALERT',
] as const;

export type PushNotificationType = typeof PUSH_NOTIFICATION_TYPES[number];
