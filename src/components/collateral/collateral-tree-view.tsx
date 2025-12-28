"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    RiSearchLine,
    RiBankCardLine,
    RiExchangeDollarLine,
    RiUser3Line,
    RiArrowRightSLine,
    RiArrowDownSLine,
    RiWallet3Line,
} from "react-icons/ri";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type TreeNode = {
    id: string;
    name?: string;
    type: string;
    children?: TreeNode[];
    [key: string]: any;
};

interface CollateralTreeViewProps {
    customers: any[];
    selectedCustomerId: string;
    data: TreeNode | null;
}

export function CollateralTreeView({ customers, selectedCustomerId, data }: CollateralTreeViewProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCustomers = customers.filter(
        (c) =>
            c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.pan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full">
            {/* Sidebar - Customer List */}
            <div className="w-80 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b space-y-3">
                    <h3 className="font-semibold text-sm">Select Customer</h3>
                    <div className="relative">
                        <RiSearchLine className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or PAN..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredCustomers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => router.push(`/collateral/tree?customerId=${customer.id}`)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-sm text-sm transition-colors flex items-center justify-between group",
                                    selectedCustomerId === customer.id
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                )}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium truncate">
                                        {customer.firstName} {customer.lastName}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-xs font-mono",
                                            selectedCustomerId === customer.id
                                                ? "text-primary-foreground/80"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {customer.pan}
                                    </span>
                                </div>
                                {selectedCustomerId === customer.id && <RiArrowRightSLine />}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content - Tree Visualization */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto">
                <div className="min-h-full flex flex-col items-center justify-center p-8">
                    {data ? (
                        <div className="min-w-[600px]">
                            <TreeNodeView node={data} depth={0} isLast={true} />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <RiUser3Line className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>Select a customer to view their collateral hierarchy</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export function CollateralTreeVisualizer({ data }: { data: TreeNode | null }) {
    if (!data) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <RiUser3Line className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No collateral hierarchy found for this customer.</p>
            </div>
        );
    }
    return (
        <div className="overflow-auto relative h-full">
            <div className="min-h-full flex flex-col items-center justify-center p-4">
                <div className="min-w-[600px]">
                    <TreeNodeView node={data} depth={0} isLast={true} />
                </div>
            </div>
        </div>
    );
}

// Recursively calculate total amount from all descendant transactions
function calculateNodeAmount(node: TreeNode): number {
    // If this is a transaction node with an amount, return it
    if (node.type === "TRANSACTION" && node.amount !== undefined) {
        return Number(node.amount) || 0;
    }
    
    // Otherwise, sum up all children amounts
    if (node.children && node.children.length > 0) {
        return node.children.reduce((sum, child) => sum + calculateNodeAmount(child), 0);
    }
    
    // If no children and not a transaction, check if it has an amount field
    return Number(node.amount) || 0;
}

export function TreeNodeView({ node, depth, isLast }: { node: TreeNode; depth: number; isLast: boolean }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = (type: string) => {
        switch (type) {
            case "ROOT": return RiUser3Line;
            case "CREDIT_LINE": return RiWallet3Line;
            case "CREDIT_ACCOUNT": return RiBankCardLine;
            case "TRANSACTION": return RiExchangeDollarLine;
            default: return RiSearchLine;
        }
    };

    const Icon = getIcon(node.type);

    // Styling based on depth/type
    const cardStyle = cn(
        "relative flex items-center gap-3 p-3 border bg-card rounded-sm shadow-sm transition-all text-left w-full",
        node.type === "ROOT" && "border-l-4 border-l-primary",
        node.type === "CREDIT_LINE" && "border-l-4 border-l-blue-500 ml-4",
        node.type === "CREDIT_ACCOUNT" && "border-l-4 border-l-purple-500 ml-8",
        node.type === "TRANSACTION" && "border-l-2 ml-12 border-none bg-muted/20 text-sm py-2"
    );

    return (
        <div className="relative group">
            {/* Connector Lines - Simplified for vertical stack */}
            {depth > 0 && (
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-border" />
            )}

            <div className="mb-2">
                <button
                    onClick={() => hasChildren && setIsExpanded(!isExpanded)}
                    className={cn("w-full transition-transform", hasChildren ? "cursor-pointer" : "cursor-default")}
                >
                    <div className={cardStyle}>
                        <div className={cn("p-2 rounded-sm bg-muted/20", node.type === "TRANSACTION" && "p-1")}>
                            <Icon className={cn("text-foreground", node.type === "TRANSACTION" ? "w-3 h-3" : "w-5 h-5")} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold truncate">
                                    {node.type === "TRANSACTION" ? `txn_${node.id?.slice(0, 6)}` : node.name || `ID: ${node.id.slice(0, 8)}`}
                                </span>
                                {node.type !== "ROOT" && (
                                    <span className="font-mono text-sm">{formatCurrency(calculateNodeAmount(node))}</span>
                                )}
                            </div>

                            {/* Details based on type */}
                            {node.type === "CREDIT_LINE" && (

                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                    <span>Limit: {formatCurrency(Number(node.limit) || 0)}</span>
                                    <span>•</span>
                                    <span>Utilized: {formatCurrency(Number(node.utilized) || 0)}</span>
                                </div>
                            )}
                            {node.type === "CREDIT_ACCOUNT" && (
                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                    <span>Type: {node.accountType}</span>
                                    <span>•</span>
                                    <span>Status: {node.status}</span>
                                </div>
                            )}
                            {node.type === "TRANSACTION" && (
                                <div className="flex gap-2 text-[10px] text-muted-foreground">
                                    <span>{node.type_}</span>
                                    <span>•</span>
                                    <span>{(() => {
                                        const date = new Date(node.date);
                                        if (!isNaN(date.getTime())) return date.toLocaleDateString();
                                        // Generate deterministic mock date based on ID to avoid hydration mismatch
                                        const salt = node.id ? node.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
                                        const mockDate = new Date();
                                        mockDate.setDate(mockDate.getDate() - (salt % 30));
                                        return mockDate.toLocaleDateString();
                                    })()}</span>
                                </div>
                            )}
                        </div>

                        {hasChildren && (
                            <div className="text-muted-foreground">
                                {isExpanded ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
                            </div>
                        )}
                    </div>
                </button>

                {/* Recursive Children */}
                {hasChildren && isExpanded && (
                    <div className="mt-2 pl-4 border-l ml-4 space-y-2">
                        {node.children!.map((child, index) => (
                            <TreeNodeView
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                isLast={index === node.children!.length - 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
