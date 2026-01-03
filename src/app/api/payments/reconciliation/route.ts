import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, loans, customers, users } from "@/db/schema";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/payments/reconciliation
 * List payments for reconciliation (filtered by status/reconciled state)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || !hasPermission(session.user.role, "loans:manage")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "SUCCESS";
        const reconciled = searchParams.get("reconciled"); // "true", "false", or undefined

        let conditions = [eq(payments.status, status)];

        if (reconciled === "true") {
            conditions.push(eq(payments.isReconciled, true));
        } else if (reconciled === "false") {
            conditions.push(eq(payments.isReconciled, false));
        }

        const paymentList = await db.query.payments.findMany({
            where: and(...conditions),
            orderBy: [desc(payments.paymentDate)],
            with: {
                loan: {
                    columns: {
                        loanNumber: true,
                    },
                    with: {
                        customer: {
                            columns: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            limit: 100,
        });

        // Flatten data for frontend
        const formatted = paymentList.map((p) => ({
            id: p.id,
            amount: p.amount,
            date: p.paymentDate,
            mode: p.paymentMode,
            reference: p.transactionRef,
            status: p.status,
            isReconciled: p.isReconciled,
            reconciliationNotes: p.reconciliationNotes,
            reconciledAt: p.reconciledAt,
            loanNumber: p.loan.loanNumber,
            customerName: `${p.loan.customer.firstName} ${p.loan.customer.lastName}`,
            customerEmail: p.loan.customer.email,
        }));

        return NextResponse.json({ payments: formatted });
    } catch (error) {
        console.error("List payments error:", error);
        return NextResponse.json(
            { error: "Failed to list payments" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/payments/reconciliation
 * Reconcile a payment
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || !hasPermission(session.user.role, "loans:manage")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { paymentId, notes, action } = body; // action: 'reconcile' | 'unreconcile'

        if (!paymentId) {
            return NextResponse.json(
                { error: "Payment ID is required" },
                { status: 400 }
            );
        }

        const isReconciling = action === 'reconcile';

        const [updated] = await db
            .update(payments)
            .set({
                isReconciled: isReconciling,
                reconciledAt: isReconciling ? new Date().toISOString() : null,
                reconciledById: isReconciling ? session.user.id : null,
                reconciliationNotes: notes || null,
            })
            .where(eq(payments.id, paymentId))
            .returning();

        await logAudit({
            action: "UPDATE",
            entityType: "TRANSACTION",
            entityId: paymentId,
            description: `Payment ${isReconciling ? 'reconciled' : 'unreconciled'}`,
            metadata: { notes, action },
            userId: session.user.id,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Reconcile payment error:", error);
        return NextResponse.json(
            { error: "Failed to reconcile payment" },
            { status: 500 }
        );
    }
}
