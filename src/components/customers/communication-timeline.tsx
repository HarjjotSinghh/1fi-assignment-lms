"use client";

import {
    RiMailLine,
    RiPhoneLine,
    RiMessage2Line,
    RiSmartphoneLine,
    RiArrowRightUpLine,
    RiArrowLeftDownLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type Log = {
    id: string;
    channel: string;
    direction: string;
    content: string;
    subject?: string | null;
    status: string;
    createdAt: string;
};

const channelIcons: Record<string, React.ReactNode> = {
    EMAIL: <RiMailLine className="h-4 w-4" />,
    SMS: <RiSmartphoneLine className="h-4 w-4" />,
    WHATSAPP: <RiMessage2Line className="h-4 w-4" />,
    CALL: <RiPhoneLine className="h-4 w-4" />,
};

const channelColors: Record<string, string> = {
    EMAIL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    SMS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    WHATSAPP: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CALL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function CommunicationTimeline({ logs }: { logs: Log[] }) {
    if (logs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                <RiMessage2Line className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No communication history found.</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 pl-6 before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-px before:bg-border">
            {logs.map((log) => (
                <div key={log.id} className="relative">
                    {/* Icon */}
                    <div className={`absolute -left-[34px] p-2 rounded-full border ring-4 ring-background ${channelColors[log.channel] || "bg-gray-100"}`}>
                        {channelIcons[log.channel] || <RiMessage2Line className="h-4 w-4" />}
                    </div>

                    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 h-5">
                                    {log.direction === "INBOUND" ? (
                                        <RiArrowLeftDownLine className="h-3 w-3 text-success" />
                                    ) : (
                                        <RiArrowRightUpLine className="h-3 w-3 text-primary" />
                                    )}
                                    {log.direction}
                                </Badge>
                                <span className="font-semibold text-sm">
                                    {log.subject || `${log.channel} Message`}
                                </span>
                            </div>
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </time>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {log.content}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px] h-5">
                                {log.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {new Date(log.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
