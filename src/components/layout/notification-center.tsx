"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BellIcon, CheckIcon } from "lucide-react";
import { getNotificationsAction, markNotificationReadAction } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean | null;
    createdAt: string;
}

export function NotificationCenter({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!userId) return;
        async function load() {
            const res = await getNotificationsAction(userId);
            if (res.success && res.data) {
                // Cast the response data to match Expected Interface if needed
                // Assuming data matches schema
                const data = res.data as Notification[];
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        }
        load();

        // Poll every 30s
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    async function handleMarkRead(id: string) {
        await markNotificationReadAction(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="grid">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-0",
                                        !notification.isRead && "bg-muted/20"
                                    )}
                                >
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                            onClick={() => handleMarkRead(notification.id)}
                                        >
                                            <CheckIcon className="h-3 w-3" />
                                            <span className="sr-only">Mark as read</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
