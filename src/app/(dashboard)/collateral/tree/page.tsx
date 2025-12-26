import { db } from "@/db";
import { customers } from "@/db/schema";

import { CollateralTreeView } from "@/components/collateral/collateral-tree-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RiNodeTree } from "react-icons/ri";

export default async function CollateralTreePage({
    searchParams,
}: {
    searchParams: Promise<{ customerId?: string }>;
}) {
    // Fetch all customers for the selector
    const allCustomers = await db.select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        pan: customers.panNumber,
    }).from(customers);

    const resolvedParams = await searchParams;
    const selectedCustomerId = resolvedParams.customerId || allCustomers[0]?.id;
    let treeData = null;

    if (selectedCustomerId) {
        const customer = allCustomers.find(c => c.id === selectedCustomerId);

        // Generate MOCK Data for the Tree
        // This ensures a randomized tree every time as requested
        const mockLines = Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map((_, i) => {
            const lineId = `CL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const limit = Math.floor(Math.random() * 500000) + 100000;
            const utilized = Math.floor(Math.random() * limit);

            return {
                id: lineId,
                lineNumber: `LN-${Math.floor(Math.random() * 10000)}`,
                sanctionedLimit: limit,
                utilizedAmount: utilized,
                availableLimit: limit - utilized,
                status: "ACTIVE",
                customerId: selectedCustomerId,
                type: "CREDIT_LINE",
                children: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, j) => {
                    const accountId = `ACC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                    const types = ["CREDIT_CARD", "OVERDRAFT", "TERM_LOAN"];
                    const accLimit = Math.floor(limit / 2);
                    const balance = Math.floor(Math.random() * accLimit);

                    return {
                        id: accountId,
                        accountNumber: `XXXX-${Math.floor(Math.random() * 9000) + 1000}`,
                        accountType: types[Math.floor(Math.random() * types.length)],
                        creditLimit: accLimit,
                        currentBalance: balance,
                        availableCredit: accLimit - balance,
                        status: "ACTIVE",
                        creditLineId: lineId,
                        type: "CREDIT_ACCOUNT",
                        children: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map((_, k) => {
                            const amount = Math.floor(Math.random() * 5000) + 100;
                            const txnTypes = ["PURCHASE", "PAYMENT", "INTEREST"];

                            return {
                                id: `TXN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                                transactionId: `TX-${Math.floor(Math.random() * 100000)}`,
                                type: "TRANSACTION",
                                name: `Txn: ${amount}`,
                                amount: amount,
                                description: `Mock Transaction ${k + 1}`,
                                status: "COMPLETED",
                                transactionDate: new Date().toISOString(),
                                txnType: txnTypes[Math.floor(Math.random() * txnTypes.length)]
                            };
                        })
                    };
                })
            };
        });

        treeData = {
            id: "root",
            name: `${customer?.firstName} ${customer?.lastName}`,
            type: "ROOT",
            details: { pan: customer?.pan, id: customer?.id },
            children: mockLines
        };
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col p-6 animate-fade-in gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-none">
                    <RiNodeTree className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-heading">User Collateral Tree</h1>
                    <p className="text-muted-foreground">Hierarchical view of credit lines, accounts, and underlying assets.</p>
                </div>
            </div>

            <div className="flex-1 border rounded-none overflow-hidden bg-background">
                <CollateralTreeView
                    customers={allCustomers}
                    selectedCustomerId={selectedCustomerId}
                    data={treeData}
                />
            </div>
        </div>
    );
}
