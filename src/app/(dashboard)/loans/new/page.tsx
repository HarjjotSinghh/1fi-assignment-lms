import { db } from "@/db";
import { customers, loanProducts } from "@/db/schema";
import { LoanWizard } from "@/components/loans/loan-wizard";
import { RiArrowLeftLine } from "react-icons/ri";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getCustomers() {
    try {
        return await db
            .select({
                id: customers.id,
                firstName: customers.firstName,
                lastName: customers.lastName,
                email: customers.email,
            })
            .from(customers);
    } catch {
        return [];
    }
}

async function getLoanProducts() {
    try {
        return await db.select().from(loanProducts);
    } catch {
        return [];
    }
}

export default async function NewLoanPage() {
    const [customersData, productsData] = await Promise.all([
        getCustomers(),
        getLoanProducts(),
    ]);

    const formattedCustomers = customersData.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
    }));

    const formattedProducts = productsData.map((p) => ({
        id: p.id,
        name: p.name,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        interestRate: p.interestRatePercent,
        minTenure: p.minTenureMonths,
        maxTenure: p.maxTenureMonths,
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/loans">
                        <RiArrowLeftLine className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">New Loan</h1>
                    <p className="text-sm text-muted-foreground">Create and disburse a new loan for a customer.</p>
                </div>
            </div>

            <LoanWizard customers={formattedCustomers} products={formattedProducts} />
        </div>
    );
}
