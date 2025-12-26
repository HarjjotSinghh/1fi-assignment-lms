"use server";

import { db } from "@/db";
import { loanApplications, loans, emiSchedule } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMonths, format } from "date-fns";

type CreateLoanParams = {
    customerId: string;
    productId: string;
    amount: number;
    tenure: number;
    interestRate: number;
    disbursementDate: string;
};

export async function createLoanAction(data: CreateLoanParams) {
    try {
        const { customerId, productId, amount, tenure, interestRate, disbursementDate } = data;

        // 1. Calculate EMI and Schedule
        const monthlyRate = interestRate / 12 / 100;
        const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);

        // Generate Schedule
        const schedule: {
            installmentNo: number;
            dueDate: string;
            emiAmount: number;
            principalAmount: number;
            interestAmount: number;
        }[] = [];
        let remainingPrincipal = amount;
        const startDate = new Date(disbursementDate);
        let maturityDate = new Date(disbursementDate);

        for (let i = 1; i <= tenure; i++) {
            const interestComponent = remainingPrincipal * monthlyRate;
            const principalComponent = emi - interestComponent;
            remainingPrincipal -= principalComponent;
            const dueDate = addMonths(startDate, i);

            schedule.push({
                installmentNo: i,
                dueDate: format(dueDate, "yyyy-MM-dd"),
                emiAmount: emi,
                principalAmount: principalComponent,
                interestAmount: interestComponent,
            });

            if (i === tenure) {
                maturityDate = dueDate;
            }
        }

        // 2. Database Transaction
        const loanId = await db.transaction(async (tx) => {
            // A. Create Application (Auto-Approved & Disbursed)
            const [app] = await tx.insert(loanApplications).values({
                customerId,
                productId,
                requestedAmount: amount,
                approvedAmount: amount,
                tenure,
                status: "DISBURSED",
                statusReason: "Manual creation via Loan Wizard",
                submittedAt: new Date().toISOString(),
                approvedAt: new Date().toISOString(),
                disbursedAt: new Date().toISOString(), // Using now or disbursementDate? keeping simple
                source: "MANUAL",
            }).returning({ id: loanApplications.id, applicationNumber: loanApplications.applicationNumber });

            // B. Create Loan
            const [loan] = await tx.insert(loans).values({
                customerId,
                productId,
                applicationId: app.id,
                principalAmount: amount,
                interestRate,
                tenure,
                emiAmount: emi,
                outstandingPrincipal: amount,
                outstandingInterest: 0,
                totalOutstanding: amount, // Start with principal
                disbursedAmount: amount,
                disbursedAt: disbursementDate,
                maturityDate: format(maturityDate, "yyyy-MM-dd"),
                status: "ACTIVE",
                currentLtv: 0, // No collateral linked yet in this wizard
            }).returning({ id: loans.id });

            // C. Insert EMI Schedule
            if (schedule.length > 0) {
                await tx.insert(emiSchedule).values(
                    schedule.map(s => ({
                        loanId: loan.id,
                        installmentNo: s.installmentNo,
                        dueDate: s.dueDate,
                        emiAmount: s.emiAmount,
                        principalAmount: s.principalAmount,
                        interestAmount: s.interestAmount,
                        status: "PENDING",
                    }))
                );
            }

            return loan.id;
        });

        revalidatePath("/loans");
        return { success: true, loanId };
    } catch (error) {
        console.error("Failed to create loan:", error);
        return { success: false, error: "Failed to create loan" };
    }
}
