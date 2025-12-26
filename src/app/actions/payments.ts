"use server";

import { db } from "@/db";
import { loans, payments, emiSchedule } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type RecordPaymentParams = {
    loanId: string;
    amount: number;
    paymentDate: string;
    paymentMode: string; // "CASH" | "UPI" | "NEFT"
    transactionRef?: string;
};

export async function recordPaymentAction(data: RecordPaymentParams) {
    try {
        const { loanId, amount, paymentDate, paymentMode, transactionRef } = data;

        // 1. Fetch Loan
        const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));
        if (!loan) {
            return { success: false, error: "Loan not found" };
        }

        await db.transaction(async (tx) => {
            // 2. Create Payment Record
            await tx.insert(payments).values({
                loanId,
                amount,
                paymentDate,
                paymentMode,
                transactionRef,
                status: "SUCCESS",
            });

            // 3. Update Outstanding
            // Simple logic: reduce totalOutstanding. 
            // In real app, we'd split into principal/interest.
            const newOutstanding = Math.max(0, loan.totalOutstanding - amount);

            await tx.update(loans)
                .set({
                    totalOutstanding: newOutstanding,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(loans.id, loanId));

            // 4. Update EMI Schedule
            // Find pending EMIs sorted by due date
            const pendingEmis = await tx.select()
                .from(emiSchedule)
                .where(and(eq(emiSchedule.loanId, loanId), eq(emiSchedule.status, "PENDING")))
                .orderBy(asc(emiSchedule.installmentNo));

            let remainingPayment = amount;

            for (const emi of pendingEmis) {
                if (remainingPayment <= 0) break;

                const due = emi.emiAmount - (emi.paidAmount || 0);

                if (remainingPayment >= due) {
                    // Full payment of this EMI
                    await tx.update(emiSchedule)
                        .set({
                            status: "PAID",
                            paidAmount: emi.emiAmount,
                            paidAt: paymentDate
                        })
                        .where(eq(emiSchedule.id, emi.id));
                    remainingPayment -= due;
                } else {
                    // Partial payment
                    await tx.update(emiSchedule)
                        .set({
                            paidAmount: (emi.paidAmount || 0) + remainingPayment,
                            // status: "PARTIALLY_PAID" // status enum might limit this, keeping PENDING if simple
                        })
                        .where(eq(emiSchedule.id, emi.id));
                    remainingPayment = 0;
                }
            }
        });

        revalidatePath(`/loans/${loanId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to record payment:", error);
        return { success: false, error: "Failed to record payment" };
    }
}
