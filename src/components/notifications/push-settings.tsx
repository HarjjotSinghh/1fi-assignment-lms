"use client";

import { useEffect, useState, useCallback } from "react";
import {
    RiBellLine,
    RiSmartphoneLine,
    RiLoader4Line,
    RiDeleteBinLine,
    RiCheckLine,
    RiCloseLine,
    RiNotification3Line,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscription {
    id: string;
    deviceName: string;
    createdAt: string;
    lastUsedAt: string | null;
}

export function PushNotificationSettings() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [vapidKey, setVapidKey] = useState<string>("");

    // Check browser support and current status
    useEffect(() => {
        const checkSupport = async () => {
            const supported = "serviceWorker" in navigator && "PushManager" in window;
            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);

                // Load existing subscriptions
                try {
                    const res = await fetch("/api/notifications/subscribe");
                    if (res.ok) {
                        const data = await res.json();
                        setVapidKey(data.vapidPublicKey);
                        setSubscriptions(data.subscriptions);
                        setIsSubscribed(data.subscriptions.length > 0);
                    }
                } catch (error) {
                    console.error("Error loading subscriptions:", error);
                }
            }

            setIsLoading(false);
        };

        checkSupport();
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!isSupported || !vapidKey) return;

        setIsLoading(true);

        try {
            // Request notification permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== "granted") {
                toast.error("Notification permission denied");
                setIsLoading(false);
                return;
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
            });

            // Send subscription to server
            const res = await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    deviceName: detectDevice(),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setIsSubscribed(true);
                setSubscriptions(prev => [
                    ...prev,
                    { id: data.subscriptionId, deviceName: detectDevice(), createdAt: new Date().toISOString(), lastUsedAt: null }
                ]);
                toast.success("Push notifications enabled!");
            } else {
                toast.error("Failed to save subscription");
            }
        } catch (error) {
            console.error("Subscription error:", error);
            toast.error("Failed to enable push notifications");
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, vapidKey]);

    // Unsubscribe from push notifications
    const unsubscribe = async (subscriptionId?: string) => {
        setIsLoading(true);

        try {
            const url = subscriptionId 
                ? `/api/notifications/subscribe?id=${subscriptionId}`
                : "/api/notifications/subscribe";

            await fetch(url, { method: "DELETE" });

            if (subscriptionId) {
                setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
                toast.success("Device removed");
            } else {
                // Also unsubscribe from browser
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
                setSubscriptions([]);
                setIsSubscribed(false);
                toast.success("Push notifications disabled");
            }
        } catch (error) {
            console.error("Unsubscribe error:", error);
            toast.error("Failed to unsubscribe");
        } finally {
            setIsLoading(false);
        }
    };

    // Test notification
    const sendTestNotification = async () => {
        try {
            // Try to use the Notification API directly for testing
            if (Notification.permission === "granted") {
                new Notification("Test Notification", {
                    body: "Push notifications are working!",
                    icon: "/icons/icon-192x192.png",
                });
                toast.success("Test notification sent!");
            }
        } catch (error) {
            console.error("Test notification error:", error);
            toast.error("Could not send test notification");
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RiBellLine className="h-5 w-5" />
                        Push Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                        <RiCloseLine className="h-5 w-5 text-amber-600" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Push notifications are not supported in this browser.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <RiBellLine className="h-5 w-5" />
                            Push Notifications
                        </CardTitle>
                        <CardDescription>
                            Receive real-time alerts for important events
                        </CardDescription>
                    </div>
                    <Switch
                        checked={isSubscribed}
                        onCheckedChange={(checked) => {
                            if (checked) subscribe();
                            else unsubscribe();
                        }}
                        disabled={isLoading}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Permission Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Browser Permission</span>
                    <Badge variant={permission === "granted" ? "default" : "secondary"}>
                        {permission === "granted" && <RiCheckLine className="h-3 w-3 mr-1" />}
                        {permission.charAt(0).toUpperCase() + permission.slice(1)}
                    </Badge>
                </div>

                {/* Subscribed Devices */}
                {subscriptions.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Subscribed Devices</p>
                        {subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RiSmartphoneLine className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-sm">{sub.deviceName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Added {format(new Date(sub.createdAt), "PP")}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => unsubscribe(sub.id)}
                                >
                                    <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Test Button */}
                {isSubscribed && (
                    <Button variant="outline" className="w-full" onClick={sendTestNotification}>
                        <RiNotification3Line className="mr-2 h-4 w-4" />
                        Send Test Notification
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function detectDevice(): string {
    const ua = navigator.userAgent;
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("iPad")) return "iPad";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("Windows")) return "Windows PC";
    if (ua.includes("Macintosh")) return "Mac";
    return "This Device";
}
