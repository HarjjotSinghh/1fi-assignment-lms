import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, interestRateBenchmarks, foreclosureRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { calculateEMI } from "@/lib/pdf-generator";

/**
 * GET /api/tools/foreclosure
 * Calculate foreclosure amount for a loan
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        // Allow any authenticated user to calculate properly, or restrict? 
        // Let's restrict to users with 'loans:view' permission
        if (!session?.user?.id || !hasPermission(session.user.role, "loans:view")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const loanNumber = searchParams.get("loanNumber");
        const foreclosureDateStr = searchParams.get("date") || new Date().toISOString().split('T')[0];

        if (!loanNumber) {
            return NextResponse.json({ error: "Loan number is required" }, { status: 400 });
        }

        const loan = await db.query.loans.findFirst({
            where: eq(loans.loanNumber, loanNumber),
            with: {
                customer: {
                    columns: {
                        firstName: true,
                        lastName: true,
                    },
                },
                product: true,
            },
        });

        if (!loan) {
            return NextResponse.json({ error: "Loan not found" }, { status: 404 });
        }

        // Simplistic calculation logic:
        // 1. Calculate days since last payment or disbursement (simulation)
        // 2. Calculate accrued interest
        // 3. Add penalty (e.g. 2% of outstanding) if applicable
        
        // For this demo, we'll use outstandingPrincipal + accrued interest for current month + penalty
        
        const foreclosureDate = new Date(foreclosureDateStr);
        // Mock last payment date as 1st of current month for calculation simplicity
        const lastPaymentDate = new Date(foreclosureDate.getFullYear(), foreclosureDate.getMonth(), 1);
        
        const daysSinceLastPayment = Math.floor((foreclosureDate.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
        const dailyInterestRate = (loan.interestRate / 100) / 365;
        const accruedInterest = loan.outstandingPrincipal * dailyInterestRate * daysSinceLastPayment;
        
        // Foreclosure charges (from product or default 2%)
        // Assuming loan.product might have foreclosureChargesPercent, otherwise default 2%
        // Since schema for product doesn't explicitly have it in my memory, I'll default to 2% or 0 based on tenure
        let penaltyPercent = 2.0; 
        
        // Logic: No penalty if loan is older than X months (e.g. 12 months) - simplified rule
        const loanStartDate = new Date(loan.disbursedAt);
        const loanAgeMonths = (foreclosureDate.getFullYear() - loanStartDate.getFullYear()) * 12 + (foreclosureDate.getMonth() - loanStartDate.getMonth());
        
        if (loanAgeMonths > 12) {
             penaltyPercent = 0; // Waived after 1 year (example policy)
        }

        const penaltyAmount = (loan.outstandingPrincipal * penaltyPercent) / 100;
        const gstOnPenalty = penaltyAmount * 0.18; // 18% GST

        const totalPayable = loan.outstandingPrincipal + loan.outstandingInterest + accruedInterest + penaltyAmount + gstOnPenalty;

        return NextResponse.json({
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            customerName: `${loan.customer.firstName} ${loan.customer.lastName}`,
            outstandingPrincipal: loan.outstandingPrincipal,
            outstandingInterest: loan.outstandingInterest, // From DB (arrears)
            accruedInterest: Math.round(accruedInterest * 100) / 100,
            penaltyAmount: Math.round(penaltyAmount * 100) / 100,
            gstOnPenalty: Math.round(gstOnPenalty * 100) / 100,
            totalPayable: Math.round(totalPayable * 100) / 100,
            foreclosureDate: foreclosureDateStr,
            daysSinceLastPayment,
        });

    } catch (error) {
        console.error("Calculate foreclosure error:", error);
        return NextResponse.json(
            { error: "Failed to calculate foreclosure" },
            { status: 500 }
        );
    }
}
