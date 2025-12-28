import { db } from "@/db";
import { webhooks, webhookDeliveries, partners } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";

// ============================================
// WEBHOOK EVENT TYPES
// ============================================

export const WEBHOOK_EVENTS = {
    // Loan lifecycle events
    "loan.approved": "Loan application approved",
    "loan.rejected": "Loan application rejected",
    "loan.disbursed": "Loan amount disbursed",
    "loan.closed": "Loan closed/paid off",
    "loan.defaulted": "Loan marked as defaulted",

    // Collateral events
    "collateral.pledged": "Collateral successfully pledged",
    "collateral.released": "Collateral released",
    "collateral.value_changed": "Collateral valuation updated",

    // Margin call events
    "margin_call.triggered": "Margin call triggered due to LTV breach",
    "margin_call.resolved": "Margin call resolved",
    "margin_call.liquidated": "Collateral liquidated due to unresolved margin call",

    // Payment events
    "payment.received": "EMI payment received",
    "payment.overdue": "Payment is overdue",

    // Application events
    "application.submitted": "New application submitted",
    "application.status_changed": "Application status changed",
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS;

// ============================================
// WEBHOOK PAYLOAD TYPES
// ============================================

interface WebhookPayload {
    event: WebhookEventType;
    timestamp: string;
    data: Record<string, unknown>;
    metadata?: {
        applicationId?: string;
        loanId?: string;
        customerId?: string;
        partnerId?: string;
    };
}

// ============================================
// SIGNATURE GENERATION
// ============================================

export function generateWebhookSignature(
    payload: string,
    secret: string
): string {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    return `sha256=${hmac.digest("hex")}`;
}

export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = generateWebhookSignature(payload, secret);
    return signature === expectedSignature;
}

// ============================================
// WEBHOOK DISPATCH
// ============================================

interface DispatchResult {
    success: boolean;
    webhookId: string;
    deliveryId: string;
    statusCode?: number;
    error?: string;
}

export async function dispatchWebhook(
    event: WebhookEventType,
    data: Record<string, unknown>,
    metadata?: WebhookPayload["metadata"]
): Promise<DispatchResult[]> {
    const results: DispatchResult[] = [];

    try {
        // Get all active webhooks subscribed to this event
        const activeWebhooks = await db
            .select()
            .from(webhooks)
            .where(eq(webhooks.isActive, true));

        // Filter webhooks that are subscribed to this event
        const subscribedWebhooks = activeWebhooks.filter((webhook) => {
            try {
                const events: string[] = JSON.parse(webhook.events);
                return events.includes(event);
            } catch {
                return false;
            }
        });

        if (subscribedWebhooks.length === 0) {
            return [];
        }

        // Prepare payload
        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
            metadata,
        };

        const payloadString = JSON.stringify(payload);

        // Dispatch to each webhook
        for (const webhook of subscribedWebhooks) {
            const signature = generateWebhookSignature(payloadString, webhook.secret);

            // Create delivery record
            const [delivery] = await db
                .insert(webhookDeliveries)
                .values({
                    webhookId: webhook.id,
                    eventType: event,
                    payload: payloadString,
                    status: "PENDING",
                    attempts: 0,
                    maxAttempts: webhook.maxRetries ?? 3,
                })
                .returning();

            try {
                // Make HTTP request
                const response = await fetch(webhook.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Webhook-Signature": signature,
                        "X-Webhook-Event": event,
                        "X-Webhook-Delivery": delivery.deliveryId,
                    },
                    body: payloadString,
                    signal: AbortSignal.timeout(30000), // 30 second timeout
                });

                const responseBody = await response.text().catch(() => "");

                // Update delivery record
                await db
                    .update(webhookDeliveries)
                    .set({
                        status: response.ok ? "SUCCESS" : "FAILED",
                        responseCode: response.status,
                        responseBody: responseBody.substring(0, 1000), // Limit response storage
                        attempts: 1,
                        lastAttemptAt: new Date().toISOString(),
                        completedAt: response.ok ? new Date().toISOString() : null,
                        nextRetryAt: response.ok
                            ? null
                            : new Date(Date.now() + (webhook.retryDelayMs ?? 5000)).toISOString(),
                    })
                    .where(eq(webhookDeliveries.id, delivery.id));

                // Update webhook last triggered
                await db
                    .update(webhooks)
                    .set({ lastTriggeredAt: new Date().toISOString() })
                    .where(eq(webhooks.id, webhook.id));

                results.push({
                    success: response.ok,
                    webhookId: webhook.id,
                    deliveryId: delivery.deliveryId,
                    statusCode: response.status,
                    error: response.ok ? undefined : `HTTP ${response.status}`,
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";

                // Update delivery record with error
                await db
                    .update(webhookDeliveries)
                    .set({
                        status: "FAILED",
                        errorMessage,
                        attempts: 1,
                        lastAttemptAt: new Date().toISOString(),
                        nextRetryAt: new Date(
                            Date.now() + (webhook.retryDelayMs ?? 5000)
                        ).toISOString(),
                    })
                    .where(eq(webhookDeliveries.id, delivery.id));

                results.push({
                    success: false,
                    webhookId: webhook.id,
                    deliveryId: delivery.deliveryId,
                    error: errorMessage,
                });
            }
        }

        return results;
    } catch (error) {
        console.error("Error dispatching webhooks:", error);
        return [];
    }
}

// ============================================
// WEBHOOK RETRY
// ============================================

export async function retryFailedDelivery(deliveryId: string): Promise<boolean> {
    try {
        const [delivery] = await db
            .select()
            .from(webhookDeliveries)
            .where(eq(webhookDeliveries.id, deliveryId));

        if (!delivery || delivery.status === "SUCCESS") {
            return false;
        }

        if ((delivery.attempts ?? 0) >= (delivery.maxAttempts ?? 3)) {
            return false;
        }

        const [webhook] = await db
            .select()
            .from(webhooks)
            .where(eq(webhooks.id, delivery.webhookId));

        if (!webhook || !webhook.isActive) {
            return false;
        }

        const signature = generateWebhookSignature(delivery.payload, webhook.secret);

        try {
            const response = await fetch(webhook.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": signature,
                    "X-Webhook-Event": delivery.eventType,
                    "X-Webhook-Delivery": delivery.deliveryId,
                    "X-Webhook-Retry": String((delivery.attempts ?? 0) + 1),
                },
                body: delivery.payload,
                signal: AbortSignal.timeout(30000),
            });

            const responseBody = await response.text().catch(() => "");

            await db
                .update(webhookDeliveries)
                .set({
                    status: response.ok ? "SUCCESS" : "RETRYING",
                    responseCode: response.status,
                    responseBody: responseBody.substring(0, 1000),
                    attempts: (delivery.attempts ?? 0) + 1,
                    lastAttemptAt: new Date().toISOString(),
                    completedAt: response.ok ? new Date().toISOString() : null,
                    nextRetryAt: response.ok
                        ? null
                        : new Date(Date.now() + (webhook.retryDelayMs ?? 5000) * ((delivery.attempts ?? 0) + 1)).toISOString(),
                })
                .where(eq(webhookDeliveries.id, deliveryId));

            return response.ok;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            await db
                .update(webhookDeliveries)
                .set({
                    status: "RETRYING",
                    errorMessage,
                    attempts: (delivery.attempts ?? 0) + 1,
                    lastAttemptAt: new Date().toISOString(),
                    nextRetryAt: new Date(
                        Date.now() + (webhook.retryDelayMs ?? 5000) * ((delivery.attempts ?? 0) + 1)
                    ).toISOString(),
                })
                .where(eq(webhookDeliveries.id, deliveryId));

            return false;
        }
    } catch (error) {
        console.error("Error retrying webhook delivery:", error);
        return false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function generateWebhookSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "whsec_";
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}
